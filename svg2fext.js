// Add contours to SFNT font
let maxY = -500
let minY = 500
let maxX = -500
let minX = 500
glyph.contours = _.map(sfntContours, function (sfntContour) {
  var contour = new sfnt.Contour();
  contour.points = _.map(sfntContour, function (sfntPoint) {
    if (sfntPoint.y > maxY)
      maxY = sfntPoint.y
    else if (sfntPoint.y < minY)
      minY = sfntPoint.y
    if (sfntPoint.x > maxX)
      maxX = sfntPoint.x
    else if (sfntPoint.x < minX)
      minX = sfntPoint.x
  });
});
let zoom = (maxY - minY) / 360
maxY = maxY / zoom
minY = minY / zoom

maxX = maxX / zoom
minX = minX / zoom
// console.log(maxY, minY);
let offsetX = (400 - maxX - minX) / 2
// 400-(maxX+x)=minX+x
let offsetY = (maxY + minY) / 2 + 100
glyph.contours = _.map(sfntContours, function (sfntContour) {
  var contour = new sfnt.Contour();
  contour.points = _.map(sfntContour, function (sfntPoint) {
    var point = new sfnt.Point();

    point.x = offsetX + sfntPoint.x / zoom;
    point.y = offsetY - (sfntPoint.y / zoom);
    point.onCurve = sfntPoint.onCurve;
    return point;
  });
  // maxY-x=-minY+x 360
  return contour;
});