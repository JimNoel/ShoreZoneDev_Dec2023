/**
 * YouTube utilities
 * NOTE:  This won't work on iOS devices!  See  https://developers.google.com/youtube/iframe_api_reference#Mobile_considerations
 *    "To prevent unsolicited downloads over cellular networks at the user’s expense, embedded media cannot be played automatically in Safari on iOS — the user always initiates playback."
 *    "Due to this restriction, functions and parameters such as autoplay, playVideo(), loadVideoById() won't work in all mobile environments."
 *    [Could I still seekTo, and just use the YT play control?]
 */


let youtube_player = false;
let youtube_timer = false;
let youtube_id = false;
let youtube_player_ready = false;
let youtube_progress_memory = false;
let youtube_playback_memory = 2;
let iOS_playedOnce = false;



function youtube_ready() {
  return youtube_id && youtube_player_ready;
}

function onPlayerReady(event) {
  youtube_player_ready = true;
  youtube_player.mute();
  if (deviceType==="iOS" && !iOS_playedOnce) {
    iOS_playedOnce = true;
    alert("Dear iPad/iPod/iPhone users:  Due to a security restriction in iOS, video playback will not be enabled until you manually touch the red YouTube play icon in the video panel.  Please do so, after closing this dialog.");
  }
  if (youtube_progress_memory) {
    youtube_player.seekTo(youtube_progress_memory, true);
    //youtube_player.playVideo();
  }
}

function onPlayerError(event) {
  alert("YouTube error # " + event.data);
}

function onPlayerStateChange(event) {

  let state = youtube_player.getPlayerState();

  if (state === 1 && !youtube_timer) {

    if (youtube_progress_memory) {
      szVideoWidget.setPlaybackOn(false);
      szVideoWidget.setVideoPosition(youtube_progress_memory);
      youtube_progress_memory = false;
    }

    if (youtube_playback_memory !== 1) {
      szVideoWidget.setPlaybackOn(false);
    }

    youtube_timer = setInterval(CheckVideoProgress, 500/szVideoWidget.playbackRate);

  } else if (state === 0) {      // YT.PlayerState.ENDED
  } else if (state === 2) {      // YT.PlayerState.PAUSED
  } else if (state === 3) {      // YT.PlayerState.BUFFERING
  } else if (state === 5) {      // YT.PlayerState.CUED
  }

  if (state !== 1 && youtube_timer) {
    window.clearInterval(youtube_timer);
    youtube_timer = false;
  }
}

function CheckVideoProgress() {
  let duration = youtube_player.getDuration();
  //console.log("YT video time:  " && szVideoWidget.getVideoPosition());
  szVideoWidget.update_track(szVideoWidget.getVideoPosition(), duration);
}

/*    // old Tristan code for speed slider
function changePlaybackSpeed(p) {
  // Change the playback speed of the video player to p. p should be a value between 0 and 100. 0 will indicate the lowest possible playback speed, 100 the highest
  if (!youtube_player)
    return;
  let avail_rates = youtube_player.getAvailablePlaybackRates();
  index = getProportionalInt(p, 0, avail_rates.length-1);
  let new_rate = avail_rates[index]
  // Ensure that the produced value is within possible bounds.
  console.assert(index>=0 && index<Math.max(avail_rates.length), {'index': index, 'min-index': 0, 'max-index': avail_rates.length - 1,'msg': 'Index is outside of the acceptable range.'});
  // Set the playback rate to the appropriate rate
  szVideoWidget.setPlaybackRate(new_rate, index===0, index===(avail_rates.length-1))
}

function getProportionalInt(p, min, max) {
  // Return the value that is p% of the way between min and max, rounded to the nearest integer.
  return Math.round(min + (p / 100.0) * (max - min))
}
*/

function onYouTubeIframeAPIReady() {
  // YouTube API calls this function when download of the API is complete
   youtube_player = new YT.Player("videoImageContainer", {
   height: "390",
   width: "640",
   videoId: youtube_id,
   playerVars: {"autoplay": 0, "controls": 0, "rel": 0},
   events: {
     "onReady": onPlayerReady,
     "onError": onPlayerError,
     "onStateChange": onPlayerStateChange
     }
   });
}

