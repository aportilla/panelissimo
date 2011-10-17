(function(){

    var layoutConfig = function(rootElement){
        
        var layoutList = function(items){
            var list = [];
            $.each(items,function(index,item){
                list.push(layoutItem(item));
            });
            return list;
        };
        
        var layoutItem = function(element){
            var items = $(element).children('.panelissimo');
            if (items.length === 0) { return element.id; }
            var entry = {};
            entry[element.id] = layoutList(items);
            return entry;
        };
        
        return layoutList($(rootElement).children('.panelissimo'));
        
    };

    var Cell = function(elId,subCellConfig,depth){
        
        var subCells = [],
            element = (typeof elId == 'string') ? document.getElementById(elId) : elId,
            jEl = $(element),
            isColumn = (depth%2 == 0),
            pixelSize = 0,
            position = 0;
        
        $(element).addClass(isColumn ? 'panelissimo-col' : 'panelissimo-row');
        
        for ( var key in subCellConfig ) {
            
            var subCell = subCellConfig[key],
                subCellCells = [];
            
            if ( typeof subCell == 'object' ) {
                subCell = Object.keys(subCell)[0];
                subCellCells = subCellConfig[key][subCell];
            }
            
            subCells.push(Cell(subCell,subCellCells,(depth + 1)));
        }
        
        return {
            getId           : function(){ return elId; },
            getElement      : function(){ return element; },
            getPixelSize    : function(){ return pixelSize; },
            setPosition     : function(px){ position = px; },
            setPixelSize    : function(px){ pixelSize = px; },
            addPixels       : function(px){ pixelSize += px; },
            getCell         : function(cId){
                var foundCell = false;   
                var cCount = subCells.length; 
                for (var i=0; i<cCount; i++){
                
                    if (cId == subCells[i].getId()){
                        foundCell = subCells[i];
                        break;
                    }
                    
                    foundCell = subCells[i].getCell(cId);
                    
                    if (foundCell){
                        break;
                    } 
                }
                return foundCell;
            },
            clear           : function(){
                $.each(subCells,function(index,subCell){ subCell.clear(); });
                if (depth === 0) { return; }
                jEl.css(isColumn ? { left : 'auto', width : 'auto' } : { top : 'auto', height : 'auto' });
            },
            updateSelf      : function(){
                if (depth === 0) { return; }
                jEl.css(isColumn ? { left : position, width : pixelSize } : { top : position, height : pixelSize });
            },
            updateChildren : function(parentSize,layoutConfig){

                if (subCells.length === 0){
                    return;
                }

                var avail = parentSize,
                    remainderPanels = [],
                    fillerPanel = null,
                    remainder = 0,
                    itemPosition = 0,
                    itemPixelSize = 0;

                $.each(subCells,function(index,subCell){
                
                    var lc = layoutConfig[subCell.getId()];

                    switch(lc.scale)
                    {
                    case 'fixed':
                        itemPixelSize = lc.size;
                        subCell.setPixelSize(itemPixelSize);
                        avail -= itemPixelSize;
                        break;
                    case 'percent':
                        itemPixelSize = Math.floor(parentSize * (lc.size / 100));
                        subCell.setPixelSize(itemPixelSize);
                        fillerPanel = subCell;
                        avail -= itemPixelSize;
                        break;
                    default:
                        remainderPanels.push(subCell);
                        fillerPanel = subCell;
                    }

                }); 
                
                remainder = Math.floor(avail / remainderPanels.length);
                
                $.each(remainderPanels,function(index,subCell){
                    avail -= remainder;
                    subCell.setPixelSize(remainder);
                });
                
                if (fillerPanel && avail > 0 && avail < 10){
                    fillerPanel.addPixels(avail);
                }
                
                $.each(subCells,function(index,subCell){
                    subCell.setPosition(itemPosition);
                    itemPosition += subCell.getPixelSize();
                    subCell.updateChildren(pixelSize,layoutConfig);
                    subCell.updateSelf();
                });
                
            }
        };
    };

    var Panelissimo = this.Panelissimo = function(config){
        
        var Grid = Cell(config.root,layoutConfig(config.root),0);
        var mW = config.minWidth;
        var mH = config.minHeight;
        var jRoot = $(config.root);
        
        var handleResize = function(){
        
            var w = $(window).width();
            var h = $(window).height();
            
            if (w <= mW || h <= mH){
                jRoot.removeClass('panelissimo-enabled');
                Grid.clear();
                return;
            }
            
            jRoot.addClass('panelissimo-enabled');
            Grid.setPixelSize($(config.root).width());
            Grid.updateChildren($(config.root).height(),config.elements);
        };
        
        $(window).bind("resize", handleResize);
        
        handleResize();
        
        return {
            getCell : Grid.getCell
        };
    };

}).call(this);