(function(){

  var className = 'panelist';
  var dotClassName = '.' + className;
  var dataKeyBase = 'data-' + className;
  var dataKeySize = dataKeyBase + '-size';
  var colSuffix = '-col';
  var rowSufix = '-row';
  var defaultCellStyles = {
      position: 'absolute',
      display: 'block',
      overflow: 'auto',
      width : '100%',
      height : '100%',
    };

  function getKindFromSizeValue (size) {
    return size.indexOf('px') > 0 ? 'fixed' :
           size.indexOf('%') > 0 ? 'percent' :
           size.indexOf(':') > 0 ? 'aspect' :
           'auto';
  }

  function getNumberFromSizeAndKind (size,kind) {
    var num = 0;
    switch (kind) {
      case 'fixed':
        num = parseInt(size,10);
        break;
      case 'percent':
        num = parseInt(size,10) / 100;
        break;
      case 'aspect':
        var dimension = size.split(':');
        var width = dimension[0] || 1;
        var height = dimension[1] || 1;
        num = width / height;
    }
    return num;
  }

  function getSizeConfig (dataAttr) {
    dataAttr = dataAttr || "";
    var kind = getKindFromSizeValue(dataAttr);
    var num = getNumberFromSizeAndKind(dataAttr,kind);
    return { kind : kind, number : num };
  }

  function Cell (element,depth) {

    var subCells = [],
      $el = $(element),
      isColumn = (depth%2 === 0),
      size = getSizeConfig(element.getAttribute(dataKeySize)),
      pixelSize = 0,
      parentPixelSize = 0,
      position = 0;

    $el.css(defaultCellStyles);

    $el.addClass(className + (isColumn ? colSuffix : rowSufix));

    $el.children().each(function(index,childEl){
      if(childEl.getAttribute(dataKeySize)){
        subCells.push(Cell(childEl,depth + 1));
      }
    });

    return {
      getSizeKind     : function(){ return size.kind; },
      getSizeNumber   : function(){ return size.number; },
      getSize : function(){ return size; },
      getPixelSize    : function(){ return pixelSize; },
      setPosition     : function(px){ position = px; },
      setParentPixelSize : function(px){ parentPixelSize = px; },
      setPixelSize    : function(px){ pixelSize = px; },
      addPixels       : function(px){ pixelSize += px; },
      clear : function(){
        $.each(subCells,function(index,subCell){ subCell.clear(); });
        if (depth === 0) { return; }
        $el.css(isColumn ?
          { left : 'auto', width : 'auto' } :
          { top : 'auto', height : 'auto' });
      },
      updateStyles : function(){
        if (depth === 0) { return; }
        $el.trigger('panelist-resize',isColumn ?
          { height : parentPixelSize, width : pixelSize } :
          { height : pixelSize, width : parentPixelSize});
        $el.css(isColumn ?
          { left : position, width : pixelSize } :
          { top : position, height : pixelSize });
      },
      update : function(parentSize){

        if (subCells.length === 0){
          return;
        }

        var avail = parentSize,
          remainderPanels = [],
          fillerPanel = null,
          remainder = 0,
          itemPosition = 0,
          itemPixelSize = 0;

        // first loop, set cell sizes based
        // on layout configuration
        $.each(subCells,function(index,subCell){

          var subCellSize = subCell.getSize();
          subCell.setParentPixelSize(pixelSize);

          switch(subCellSize.kind)
          {
          case 'fixed':
            itemPixelSize = subCellSize.number;
            subCell.setPixelSize(itemPixelSize);
            avail -= itemPixelSize;
            break;
          case 'percent':
            itemPixelSize = Math.floor(parentSize * subCellSize.number);
            subCell.setPixelSize(itemPixelSize);
            fillerPanel = subCell;
            avail -= itemPixelSize;
            break;
          case 'aspect':
            itemPixelSize = isColumn ?
              Math.floor(pixelSize / subCellSize.number) :
              Math.floor(pixelSize * subCellSize.number);
            subCell.setPixelSize(itemPixelSize);
            fillerPanel = subCell;
            avail -= itemPixelSize;
            break;
          default:
            remainderPanels.push(subCell);
            fillerPanel = subCell;
          }

        });

        remainderCellSize = Math.floor(avail / remainderPanels.length);

        // second loop, set size on remainder panels ( if any )
        $.each(remainderPanels,function(index,subCell){
          avail -= remainderCellSize;
          subCell.setPixelSize(remainderCellSize);
        });

        // adjust the exact pixel size of the filler panel
        if (fillerPanel && avail > 0 && avail < 10){
          fillerPanel.addPixels(avail);
        }

        // third loop
        // update all cell chilren and then update the cells dom
        $.each(subCells,function(index,subCell){
          subCell.setPosition(itemPosition);
          itemPosition += subCell.getPixelSize();
          subCell.update(pixelSize);
          subCell.updateStyles();
        });


      }
    };
  }

  function Panelist (element) {

    var $root = $(element);
    var topmostCell = Cell(element,0);
    var mW = 200;
    var mH = 200;
    var $win = $(window);

    var handleResize = function(){
      var w = $win.width();
      var h = $win.height();
      if (w <= mW || h <= mH){
        $root.removeClass(className + '-enabled');
        topmostCell.clear();
        return;
      }
      $root.addClass(className + '-enabled');
      topmostCell.setPixelSize($root.width());
      topmostCell.update($root.height());
    };

    $win.bind("resize", handleResize);

    handleResize();

  }

  function init(){
    $(dotClassName).each(function(index,el){
      Panelist(el);
    });
  }

  $(document).ready(init);

  // set the panelist constructor to our public global namespace
  this.Panelist = Panelist;

}).call(this);
