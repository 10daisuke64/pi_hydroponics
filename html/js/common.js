// ########### ページ内リンクのsmooth scroll ###########
$('a[href^="#"]').on("click", function(){
  var href= $(this).attr("href");
  var target = $(href == "#" || href == "" ? 'html' : href);
  var position = target.offset().top;
  const spacer = 0;
  var scrollPosition = position - spacer;
  $('body,html').animate({scrollTop:scrollPosition}, 500, 'swing');
  return false;
});
