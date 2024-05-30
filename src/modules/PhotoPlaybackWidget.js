/**
 * Class PhotoPlaybackWidget
 *
 * Widget for photo playback
 *   subclass of QueryBasedPanelWidget
 *
 * Constructor arguments:
 *    mapServiceLayer: MapImageLayer
 *    subLayerName: String     name of a sublayer of mapServiceLayer
 *    panel: ContentPane    panel where processed query results are displayed
 *    -- perhaps other args for outFields and where clause?
 */

define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "noaa/QueryBasedPanelWidget"
], function(declare, lang, QueryBasedPanelWidget){

// private vars and functions here
  //let picasaOffline = false;
  let latest_img_src = false;
  let latest_img_subPath = false;
  let photoSource1 = null;
  let secs_to_next_photo = null;
  let photo_play_delay = 1500;      // Wait time between photos, when in photo playback.  Set to -1 to require hitting playback buttons to advance individual photos?
//  let photo_play_timer = false;
  let photo_play_direction = 0;
  //let photo_cur_index = null;
  let photo_load_times = {};
  let photo_load_times_sort = [];
  let photo_load_average = null;		// photo_play_delay;
  let photo_enlarged = false;

  function photoLoadStartHandler() {
    //console.log("photoLoadStartHandler");
  }

  function photoLoadCompleteHandler(orig_img_src) {
    //console.log("photoLoadCompleteHandler");
  }




  return declare(QueryBasedPanelWidget, {
    // Arrays and Objects defined here are common to all instances
    // Simple types are per-instance
    perInstanceNum: 3,      // not used -- for illustration of syntax
    commonArr: [1 ,2, 3],   // not used -- for illustration of syntax

    //photo_play_timer: false,
    curr_photo_point: null,
    next_photo_point: null,
    beforeLast_photo_point: null,     // used in measurement of image load time
    last_photo_point: null,
    szPhotosVisible: true,

    // Check if latest images was loaded successfully   return bool success
    latest_photo_loaded: function() {
    return typeof photo_load_times[latest_img_src] !== "undefined" && typeof photo_load_times[latest_img_src]["load_end"] !== "undefined"
  },

  // Update photo from data point   param object next_photo_point Data point
    update_photo: function(feature) {
      let next_photo_point = feature;
      update_photo_latest_params = next_photo_point;
      if (!next_photo_point)
        return;
      latest_img_subPath = this.photoResInsert + next_photo_point[this.fileNameField];
      if (this.relPathField)
        latest_img_subPath = next_photo_point[this.relPathField] + "/" + latest_img_subPath;
      if (latest_img_subPath.search(/.jpeg/i)<0 && latest_img_subPath.search(/.jpg/i)<0)
        latest_img_subPath += ".jpg";
      let new_img_src = this.photoServer + latest_img_subPath;
      if (!latest_img_src || latest_img_src !== new_img_src) {
        photoSource1 = new_img_src;
        this.load_Photo(new_img_src);
        this.moveToFeature(next_photo_point);
      }
    },

    constructor: function(/*Object*/ kwArgs){

      lang.mixin(this, kwArgs);

      //if (this.photoServer)
      //  console.log(this.panelName + " PHOTOS:  " + this.photoServer);

      this.clickableSymbolGap = settings.photoGap;

      if (!this.photoResInsert)     // If not specified in the parameters, then set to blank string
        this.photoResInsert = "";

      this.photoImage = $("#" + this.photoImageId);

      photo_load_times = {}

      this.currNumber_SpanId = this.baseName + "_currNumber";
      this.featureCountElId = this.baseName + "_photoCount";
      this.featureCountTemplate = "/{0}";


      let photoCountHtml = "<span class='photoCount'>Photo ";
      photoCountHtml += "<span id='" + this.currNumber_SpanId + "'>0</span>";
      photoCountHtml += "<span id='" + this.featureCountElId + "'></span>";
      photoCountHtml += "</span>";
      this.footerPanel.innerHTML = makeMediaPlaybackHtml(playbackControlTemplate, this.controlData, 'photoTools', 'position: relative; float: left', this.objName) + photoCountHtml;
      if (this.sync_photos) {
        let linkHTML = "&nbsp;&nbsp;<img id='linkImage' style='float: left' src='assets/images/link.png' width='24' height='24' onclick='linkImage_clickHandler()' title='Click to link/unlink photos to video'/>";
        this.footerPanel.innerHTML = linkHTML + this.footerPanel.innerHTML;
      }

      setVisible(this.controlData[2][0], false);      // Hide the "pause" button

      this.on_image_error = function(e) {
        // Called on image load error   param object e Event object
        if (this.photoImage.attr("src") === '')
          return;
        console.log("on_image_error");
        if (e.target.src.includes(mainSzMediaServer)) {    // Tried default server and failed
          let new_img_src = altSzMediaServer + latest_img_subPath;
          this.load_Photo(new_img_src);
          this.photoServer = altSzMediaServer;
        } else if (e.target.src.includes("stillphotos_lowres/")) {    //  Lowres folder not available
          // TODO?  This isn't working?  Fix missing lowres folder on server instead?
          this.photoResInsert = "stillphotos/";
        } else {    // Tried AOOS, also failed
          setMessage(this.disabledMsgDivName, "Unable to find image.");
        }
        //this.photoImage.unbind('error');     // OBS: Was handling error only once, then switching to GINA server
        return true;
      }

      this.on_image_load = function() {
        // Called on image load success   param object e Event object
        setVisible(this, true);


        if (typeof photo_load_times[this.src] !== "undefined") {

          //photoLoadCompleteHandler(orig_img_src);

          photo_load_times[this.src]["load_end"] = Date.now();
          photo_load_times[this.src]["load_duration"] = photo_load_times[this.src]["load_end"] - photo_load_times[this.src]["load_start"];
          photo_load_times[this.src]["src"] = this.src;
          //console.log("photo load time:  "  + photo_load_times[this.src]["load_duration"])
        }

        /*
        photo_load_times_sort = $.map(photo_load_times, function(n){return n}).sort(function(a, b){return ((a["load_start"] < b["load_start"]) ? -1 : ((a["load_start"] > b["load_start"]) ? 1 : 0));});
        let photo_load_times_sort_durations = [photo_play_delay].concat($.map(photo_load_times_sort, function(n){return n.load_duration}));
        if (photo_load_times_sort_durations.length >= 5)
          photo_load_average = Math.round( photo_load_times_sort_durations.slice(photo_load_times_sort_durations.length-5).average() );
          */
        return true;
      }

      this.on_image_abort = function() {
        // Called on image load cancel   param object e Event object
        //console.log("on_image_abort");
      }

      this.photoImage.bind('load', this.on_image_load);
      this.photoImage.bind('abort', this.on_image_abort);
      this.photoImage.bind('error', this.on_image_error.bind(this));

      this.load_Photo = function(new_img_src) {
        latest_img_src = new_img_src;
        setVisible(this.photoImage[0], false);
        this.photoImage.attr("src", latest_img_src);
      }

      this.makeCaptions = function() {
        for (let p=0; p<this.features.length; p++) {
          let attrs = this.features[p].attributes;
          let caption = attrs[this.captionFields[0]];
          if (!caption)
            caption = "";
          for (let f=1; f<this.captionFields.length; f++) {
            let S = attrs[this.captionFields[f]];
            if (S)
              caption += ", " + S.replace(/@/g,";");     // because some items in DVB have "@" character
          }
          attrs.Caption = caption;
        }
      }

      this.processFeatures_Widget = function(features) {
        let hasPhotos = (this.features.length>0);
        //showEnabledDisabled("video,photo,units", hasPhotos);
        let controlContainer = this.footerPanel.getElementsByClassName("playbackControlContainer")[0];
        setVisible(controlContainer, hasPhotos);
//        if (hasPhotos)
//          this.sync_photos = false;
        if (this.captionFields)
          this.makeCaptions();
        // this.toStart();
        this.changeCurrentFeature(0);
      }

      this.photoNavigationMessage = 'Photos are linked to video and will cycle as video plays. Photo navigation currently disabled. To enable manual photo navigation, click the "Link/Unlink photos to video" chain icon to the left of the still image.';

      this.toStart = function() {
        if (this.sync_photos){
          alert(this.photoNavigationMessage);
          return;             // Not allowed if syncing with video
        }
        this.changeCurrentFeature(0);
      };

      this.playBackward = function() {
        if (this.sync_photos){
          alert(this.photoNavigationMessage);
          return;             // Not allowed if syncing with video
        }
        this.playDir = -1;
        this.changeCurrentFeature(this.counter + this.playDir);
      };

      this.pause = function() {
        alert("Not implemented yet");
      };

      this.playForward = function() {
        if (this.sync_photos){
          alert(this.photoNavigationMessage);
          return;             // Not allowed if syncing with video
        }
        this.playDir = 1;
        this.changeCurrentFeature(this.counter + this.playDir);
      };

      this.toEnd = function() {
        if (this.sync_photos){
          alert(this.photoNavigationMessage);
          return;             // Not allowed if syncing with video
        }
        this.changeCurrentFeature(this.getFeatureCount()-1);
      };

      this.updateMedia = function(attrs) {
        this.update_photo(attrs);
      };

    }

  });
});

