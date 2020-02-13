var timers = [];
function toggleBookBadge(e) {
  for (i in timers) {
    clearTimeout(timers[i])
  }
  timers = []

  switch (e) {
    case 'show':
      $('.notification-badge-book').css({
        'width': '100%',
        'height': '100%',
        'border-radius': '2px',
        //'background-color': 'rgba(64, 154, 213, 0.85)',
        //'background-color': 'rgba(71, 170, 234, 0.93)',
        'background-color': 'rgba(67, 222, 125, 0.93)',
        'animation-name': 'none',

      });
      timers.push(setTimeout(function() {
        $('.notification-badge-book').css({
          'transition': 'top 0.1s, left 0.1s, width 0.15s, height 0.15s, background-color 0.15s, border-radius 0.25s ease'
        });
        $('.notification-badge-book-inner').css({ 'display': 'grid'});
      }, 100));
      timers.push(setTimeout(function() {
        $('.notification-badge-book-inner').css({ 'opacity': '1' });
      }, 125));
      timers.push(setTimeout(function() {
        $('.notification-badge-book-inner').css({ 'transition': 'opacity 0s' });
      }, 150));
      break;
    case 'hide':
      $('.notification-badge-book').css({
        'width': '2rem',
        'height': '2rem',
        'border-radius': '2px 0 100%',
        'background-color': '#409ad5',
        'animation-name': ''
      });
      $('.notification-badge-book-inner').css({ 'opacity': '0', 'display': 'none' })
      setTimeout(function(){
        $('.notification-badge-book').css({
          'transition': 'top 0.1s, left 0.1s, width 0.15s, height 0.15s, background-color 0.15s, border-radius 0.1s ease'
        });
        $('.notification-badge-book-inner').css({ 'transition': '' });
      }, 150);
      break;
  }
}

$(function() {
  if (jQuery.browser.mobile) {
    var mobileToggle = false;
    $('.notification-badge-book').click(function(e) {
      if (mobileToggle) {
        $('body').unbind('click');
        toggleBookBadge('hide');
        mobileToggle = false;
      } else {
        toggleBookBadge('show');
        mobileToggle = true;

        setTimeout(function() {
          $('body').click(function(ev) {
            if (mobileToggle) {
              toggleBookBadge('hide');
              mobileToggle = false;
              $('body').unbind('click');
            }
          });
        }, 50);
      }
    });
  } else {
    $('.notification-badge-book').hover(function() {
      toggleBookBadge('show');
    }, function() {
      toggleBookBadge('hide');
    });
  }
});
