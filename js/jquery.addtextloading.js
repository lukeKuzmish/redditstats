/*
 * jQuery  plugin:     addLoadingText
 *        author:     sack_lunch <luke@lukekuzmish.com>
 *
 *
 *  usage:  $("#DivYouWishToAddLoadingTo").addTextLoading(msg);
 *
 *  adds a <p> with "Loading " (or passed in argument msg) and then three
 *  animated dots.
 *
 *
 *  LIMITATIONS:
 *    - Only a single instance can work at a time.
 *
 *    - .addTextLoading("text")   then .addTextLoading() doesn't
 *       work (uses "text" instead of default)
 *
 *
 */

(function($) {
  var tmr,
      p,
      currentText,
      loadingText = "Loading",
      timeBwDots = 140,
      timeBwAnimations = 300;

  function startDrawingDots() {
      drawDot(0);
  }
  
  function stopDrawingDots() {
    clearTimeout(tmr);
    return;
  }
  
  function drawDot(opt) {
      currentText = p.text();
      switch (opt) {
          case 0:
              tmr = setTimeout(function() { drawDot(opt+1); }, timeBwDots);
              break;
          case 1:
          case 2:
              p.text(currentText + ".");
              tmr = setTimeout(function() { drawDot(opt+1); }, timeBwDots);
              break;
          case 3:
              p.text(currentText + ".");
              tmr = setTimeout(function() { drawDot(opt+1); }, timeBwAnimations);
              break;
          case 4:
              p.text(loadingText);
              tmr = setTimeout(function() { drawDot(1); }, timeBwDots);
      }
  }

  $.fn.addTextLoading = function(msg) {
    /*
     *
     *  TODO:  add args for dot drawing times
     *
     *
     */
    loadingText = msg || loadingText;
    loadingText += " "; // TODO check if last char is a nbsp and if so, don't add another
    currentText = loadingText;
    p = $("<p/>", {css: {'display':'inline'}, text: loadingText});
    this.append(p);
    startDrawingDots();
  };

  $.fn.removeTextLoading = function() {
    stopDrawingDots();
    p.remove();
  };
})(jQuery);
