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

function posturl(dataholder, url, apikey){
  var settings = {
    "async": true,
    "crossDomain": true,
    "method": "POST",
    "headers": {
      "apikey": apikey,
      "kanbanize-integration":"spredsheet_tool",
      "Cache-Control": "no-cache",
      "muteHttpExceptions" : true
    },
    "payload": dataholder
  }
  
  try{
    var result = UrlFetchApp.fetch(url,settings);
    var json = result.getContentText();
  }
  catch(e){
    Logger.log(e + "Error when Fetch URL");
    var str = e;
    str = str +" String";
    if(str.indexOf('Blocked cards cannot be moved.') > 0){
      Logger.log('Blocked cards cannot be moved.');
    }
    else if(str.indexOf('This API key has reached the allowed limit for this method') > 0){
      Logger.log('This API key has reached its allowed limit.');
    }
    else if(str.indexOf('Completed subtasks cannot be edited.') > 0){
      Logger.log('Completed subtasks cannot be edited.');
    }
    else if(str.indexOf('] does not exist.</item>') > 0){
      Logger.log("Task does not exist..");
    }
    else if(str.indexOf('This task is not blocked, the task must be blocked first.') > 0){
      Logger.log("Task which is not blocked, cannot be unblocked! ");
    }
    else{
      Logger.log("Operation could not be completed! Try again or contact Support."+e);      
    }    
    throw e;
  }
  return result;
}
