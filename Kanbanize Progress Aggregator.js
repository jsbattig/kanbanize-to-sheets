/* 
    Copyright 2019 Ascentis Corporation

    Permission is hereby granted, free of charge, to any person obtaining a copy of this software 
    and associated documentation files (the "Software"), to deal in the Software without restriction, 
    including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
    and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, 
    subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all copies or substantial 
    portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT 
    LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH 
    THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

function KanbanizeProgressAggregator(sourceSheet) {
  /* Private stuff */
  this.sourceSheet = sourceSheet;
  this.cardsDictionary = new SimpleMap.SimpleMap(false);
  this.attributes = null;
  this.linkRegEx = new RegExp("^links\.linksData\.[0-9]+\.taskid$");
  this.dictionaryGetExceptionRegExp = new RegExp("Key '[0-9]+' doesn't exist");
  
  this.recurseTotalSize = function(card) {
    card.totalSize = 0;
    card.totalComplete = 0;
    card.subCardsCount = 0;
    if(card["links.parent"] > 0) {
      for (var attrIndex = 0; attrIndex < this.attributes[0].length; attrIndex++) {
        if (this.linkRegEx.test(this.attributes[0][attrIndex])) {
          if (card[this.attributes[0][attrIndex]] != "" && card[this.attributes[0][attrIndex]] != card.taskid) {
            var linkTypeField = this.attributes[0][attrIndex].replace("taskid", "linktype");
            if (card[linkTypeField] != 1) // Checking if relationship is of parent/child type
              continue;
            try {
              var linkedCard = this.cardsDictionary.get(card[this.attributes[0][attrIndex]]);
              this.recurseTotalSize(linkedCard);
              card.totalSize += linkedCard.totalSize;
              card.totalComplete += linkedCard.totalComplete;
              card.subCardsCount += linkedCard.subCardsCount;
            } catch(e) {
              if (!this.dictionaryGetExceptionRegExp.test(e))
                throw(e);
            }
          }
        }
      }
    }
    if (card.totalSize <= 0)
      card.totalSize = card.size > 0 ? card.size : 1; // Minimum reportable totalSize = 1
    else {
      if (card.size > card.totalSize) {
        card.totalComplete = card.size * card.totalComplete / card.totalSize;
        card.totalSize = card.size;
      }
    }
    if ((card["links.parent"] <= 0) && (card.columnid.indexOf("done") >= 0 || card.columnid.indexOf("archive") >= 0))
      card.totalComplete = card.totalSize;
    if (card.subCardsCount == 0)
      card.subCardsCount = 1;
    card.percentComplete = card.totalComplete / card.totalSize;
  }
  
  /* Public stuff */
  
  this.clearObjects = function () {
    this.cardsDictionary.clear();
  }
  
  this.populateObjects = function() {
    this.cardsDictionary.clear();
    var attributesRange = sourceSheet.getRange(1, 1, 1, sourceSheet.getLastColumn());
    this.attributes = attributesRange.getValues();
    var attributesDictionary = new SimpleMap.SimpleMap(false)
    var i = 0;
    for each(attrib in this.attributes[0])
      attributesDictionary.put(attrib, i++);
    var dataRange = sourceSheet.getRange(2, 1, sourceSheet.getLastRow(), sourceSheet.getLastColumn());
    var data = dataRange.getValues();
    
    for (var row = 0; row < data.length; row++) {
      var card = new Object();
      for (var attrIndex = 0; attrIndex < this.attributes[0].length; attrIndex++) {
        card[this.attributes[0][attrIndex]] = data[row][attrIndex];
      }   
      this.cardsDictionary.put(card.taskid, card);
    }
  }
  
  this.calculateAggregatedTotalSize = function() {
    var self = this;
    this.cardsDictionary.forEach(function(cardId) {
      self.recurseTotalSize(self.cardsDictionary.get(cardId));
    });
  }
  
  this.dumpAggregatedObjectsToSheet = function(aggregatedSheet) {
    const INITIAL_ROW = 2;
    
    var dataArray = new Array();
    var i = 0;
    var self = this;
    this.cardsDictionary.forEach(function(cardId) {
      dataArray[i++] = self.cardsDictionary.get(cardId);
    });
  
    var columnsCollection = new SimpleMap.SimpleMap(false);
    var objectArrayToSheet = new SheetsHelperLibrary.ObjectArrayToSheetTransformer(aggregatedSheet, columnsCollection);
    var arrToSheetResult = objectArrayToSheet.objectArrayToSheet(dataArray, INITIAL_ROW, 0);
    if (arrToSheetResult.nextRow - INITIAL_ROW > 0) {
      var targetBuffer = objectArrayToSheet.getTargetBuffer();
      aggregatedSheet.getRange(INITIAL_ROW, 1, arrToSheetResult.nextRow - INITIAL_ROW, arrToSheetResult.columnCount).setValues(targetBuffer);
    }
  }
  
  this.calcTotalsAndDumpToSheet = function(targetSheet) {
    this.populateObjects();
    this.calculateAggregatedTotalSize();
    this.dumpAggregatedObjectsToSheet(targetSheet);
  }
}
