# kanbanize-to-sheets
Utility to easily get data from Kanbanize into Google Sheets (and more)

Use KanbanizeReader.js to read data into a sheet.
Basic code to read looks like this:

```javascript
var spreadsheet = SpreadsheetApp.openById("<you sheet ID>");
var sheet = spreadsheet.getSheetByName("TestSheet");
var reader = new KanbanizeReader("https://ascentis.kanbanize.com", "<your Kanbanize API key>"); 
reader.setIncludeColumns(new SimpleMap.SimpleMap(false, ["^taskid$", "^assignee$", "^title$", "^type$", "^workflow$", "^columnid$", "^size$", "People", "Schedule", "^links\.(child|parent|related|predecessor|successor)$", "^links\.linksData\.[0-9]+\.(linktype|taskid|linkedid|(tdetails\.(size|columnid)))"]));
reader.getKanbanizeCards(sheet, [27, 10, 11, 12, 13, 9, 17, 15, 18], true);
```

You can use Kanbanize Progress Aggregator.gs to calculate total size of top level initiatives recursively evaluating the size of all child/linked initiatives. This class will also calculate the percent complete of all initiatives downline from the top level one.

Example code:

```javascript
var spreadsheet = SpreadsheetApp.openById("<you spreadsheet ID>"); 
var sheet = spreadsheet.getSheetByName("TestSheet");
var aggregator = new KanbanizeProgressAggregator(sheet);
aggregator.populateObjects();
aggregator.calculateAggregatedTotalSize();
var aggregatedSheet = spreadsheet.getSheetByName("AggregatedTotals");
aggregator.dumpAggregatedObjectsToSheet(aggregatedSheet);
```


