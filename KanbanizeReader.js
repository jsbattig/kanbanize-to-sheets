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

function KanbanizeReader(domain, apikey) {
  /* Private stuff */
  this.domain = domain;
  this.apikey = apikey;
  this.format = "yyyy/mm/dd";
  this.excludeColumns = null; // SimpleMap
  this.includeColumns = null; // SimpleMap
  this.processColorColumnEnabled = false;
  this.processCustomFieldsEnabled = true;
  
  this.processCustomFields = function(arr) {
    for each(card in arr)
      if (card.customfields != null)
        for each(customfield in card.customfields)
          card[customfield.name] = customfield.value;
  }
  
  this.processColorColumn = function(columnsCollection, sheet, startRow, count) {
    if (!columnsCollection.exists("color"))
      return;
    var colorColumn = columnsCollection.get("color");
    if (colorColumn >= 0)
      for (var i = startRow; i < startRow + count; i++) {
        var cell = sheet.getRange(i, colorColumn);
        cell.setBackground(cell.getValue());
      }
  }
  
  /* Public Stuff */

  this.setExcludeColumns = function(excludeColumns) {
    this.excludeColumns = excludeColumns;
  }
  
  this.setIncludeColumns = function(includeColumns) {
    this.includeColumns = includeColumns;
  }
  
  this.setDateFormat = function(dateFormat) {
    this.format = dateFormat;
  }
  
  this.setProcessColorColumnEnabled = function(processColorColumnEnabled) {
    this.processColorColumnEnabled = processColorColumnEnabled;
  }
  
  this.setProcessCustomFieldsEnabled = function(processCustomFieldsEnabled) {
    this.processCustomFieldsEnabled = processCustomFieldsEnabled;
  }
  
  this.getKanbanizeCards = function(sheet, boardIds, includeArchive) {
    if (sheet.getLastRow() > 0)
      sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).clear();
   
    var columnsCollection = new SimpleMap.SimpleMap(false, ["boardid"]);
    var objectArrayToSheet = new SheetsHelperLibrary.ObjectArrayToSheetTransformer(sheet, columnsCollection);
    
    objectArrayToSheet.setExcludeColumns(this.excludeColumns);
    objectArrayToSheet.setIncludeColumns(this.includeColumns);
    objectArrayToSheet.enableAvoidDuplicates("taskid");
    var nextRow = 2;
    var columnCount = 1;
    var archiveParams = "";
    for (var round = 0; round <= 2; round++) {  
      if (round == 1 && !includeArchive)
        break;
      for each(var boardid in boardIds) {
        var readingFromArchive = round >= 1;
        var getArchivedInitiatives = round == 2;
        var page = 1;
        do {
          var url = this.domain + "/index.php/api/kanbanize/get_all_tasks/boardid/" + boardid + 
            "/format/json" + (readingFromArchive ? "/container/archive/page/" + page++ : "") +
            (readingFromArchive && getArchivedInitiatives ? "/showInitiatives/1" : "");
          var result = posturl("", url, this.apikey);
          var json = result.getContentText();
          var data = JSON.parse(json); 
          if (readingFromArchive && data.task == null)
            break; // No more pages when reading from archive
          if (this.processCustomFieldsEnabled)
            this.processCustomFields(!readingFromArchive ? data : data.task);
          var arrToSheetResult = objectArrayToSheet.objectArrayToSheet(!readingFromArchive ? data : data.task, nextRow, columnCount);
          var workflowIdx = columnsCollection.get("workflow") - 1;
          if (arrToSheetResult.nextRow - nextRow > 0) {
            var targetBuffer = objectArrayToSheet.getTargetBuffer();
            for (var i = 0; i < arrToSheetResult.nextRow - nextRow; i++) {
              targetBuffer[i][0] = boardid;
              if (readingFromArchive) {
                targetBuffer[i][workflowIdx] = getArchivedInitiatives ? 1: 0;
              }
            }
            sheet.getRange(nextRow, 1, arrToSheetResult.nextRow - nextRow, arrToSheetResult.columnCount).setValues(targetBuffer);
            if (this.processColorColumnEnabled)
              this.processColorColumn(columnsCollection, sheet, nextRow, arrToSheetResult.nextRow - nextRow);
          }
          nextRow = arrToSheetResult.nextRow;
          columnCount = arrToSheetResult.columnCount;
          if (!readingFromArchive)
            break;
        } while(true);
      }
    }
  }  
}