/**
 * Key generator extension for the Cloud9 IDE
 *
 * @copyright 2013, Rafael Leano
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 * 
 * Partialy based on the VSEP logger, by Andrew Faulring
 * https://c9.io/andrewfaulring/vseplogger/workspace/ext.vseplogger/vseplogger.js
 */

// defines the extension, this method seems to be called when all dependencies are loaded
define( function(require, exports, module) {

    // defines the requirements
    // -- core reqs
    var ide = require("core/ide");
    var ext = require("core/ext");
    var util = require("core/util");
    
    // -- additional extensions
    var menus = require("ext/menus/menus");
    var editors = require("ext/editors/editors");
    var commands = require("ext/commands/commands");
    var filesystem = require("ext/filesystem/filesystem");
    // -- this extension is loaded as text
    var markup = require("text!ext/unl_keygen/unl_keygen.xml");
    
    var logfile = ".log_" + ide.uid + ".log";
    var logpath = (ide.davPrefix + "/" + logfile ).replace(/\/+/, "/");

    var _logReady = true;
    var _logEvents = [];

    module.exports = ext.register("ext/unl_keygen/unl_keygen", {
        name     : "MTurk Key Generator",
        dev      : "rleano @ University of Nebraska-Lincoln",
        alone    : true,
        type     : ext.GENERAL,
        markup   : markup,

        nodes : [],
        
        
        //init : function(amlNode){
        init : function(){
            // keep a pointer to itself
            var _self = this;
            
            commands.addCommand({
                name : "unl_keygen",
                bindKey : {mac: "Shift-Command-J", win: "Ctrl-Shift-J"},
                hint: "generate key for MTurk",
                isAvailable : function(editor){
                    return true;
                },
                exec : function(){
                    ext.initExtension(_self);
                    _self.winKeygen.show();
                }
            });

            this.nodes.push(
                menus.addItemByPath("Tools/Generate MTurkKey", new apf.item({
                    command : "unl_keygen"
                }), 500)
            );
            
            // initialize window
            this.winKeygen = winKeygen;
            
            // creates login file
            filesystem.exists(logfile, function(exists) {
                if (!exists) {
                    filesystem.saveFile(logfile, "", function(data, state, extra) {
                        // TODO: check for errors
                        _logReady = true;
                    });

                }
                else {
                    filesystem.readFile(logpath, function(data, state, extra) {
                        // log = data; // FIXME
                        _logReady = true;
                    });
                }
            });
            
            // function that registers the tab-switching
            function logTabSwitch(event) {
                var logEvent = {
                    name: event.name
                };

                if (event.previousPage) {
                    logEvent.from = event.previousPage.name;
                }
                if (event.nextPage) {
                    logEvent.to = event.nextPage.name;
                }
                _self.logEvent(logEvent);
            }
            
            
            ide.addEventListener("tab.beforeswitch", function(event) {
                if (event.previousPage && event.previousPage.$editor) {
                    var editor = event.previousPage.$editor;
                    if (editor.amlEditor.$editor) {
                        var ace = editor.amlEditor.$editor;
                        _self.logEvent({
                            name: "tab"
                        });
                    }
                }
                logTabSwitch(event);
            });
            
            ide.addEventListener("tab.afterswitch", function(event) {
                if (event.nextPage && event.nextPage.$editor) {
                    var editor = event.nextPage.$editor;
                    // console.log(editor);
                    if (editor.amlEditor.$editor) {
                        var ace = editor.amlEditor.$editor;
                        _self.logEvent({
                            name: "tab"
                        });
                    }
                }
                logTabSwitch(event);
            });
            
            this.clearLog();
        },

        /**
         * Method that generates the MTurk Key, it asks for the MTurkID with a popup
         */
        generate : function(mturkid){
            var editor = editors.currentEditor;
            
            //v1: create hash from String --> http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
            var hash = 0, i, char, l;
            for (i = 0, l = mturkid.length; i < l; i++) {
                char  = mturkid.charCodeAt(i);
                hash  = ((hash<<5)-hash)+char;
                hash |= 0; // Convert to 32bit integer
            }
            
            for (i = 0, l = mturkid.length; i < l; i++) {
                char  = mturkid.charCodeAt(i);
                hash  = ((hash<<5)-hash)+char;
                hash |= 0; // Convert to 32bit integer
            }
            
            var temp = 0;
            for (i = 0, l = mturkid.length; i < l; i++) {
                char  = mturkid.charCodeAt(i);
                temp += char;
            }
            var hash2 = ((temp + Math.floor(Math.random() * 1e15) + new Date().getMilliseconds()).toString(36)).toUpperCase();
            var hash3 = ((temp + Math.floor(new Date().getDate()/100 * 1e15) + new Date().getDay()).toString(36)).toUpperCase();
            
            //this code breaks extension
            //var fskui = require('fs');
            //fskui.appendFile(ide.workspaceDir + "/.mturkid", ide.uid + " :: " + hash3 + "\n", function(err){ 
            //    if (err) {
            //        console.log(err);
            //    }
            //});
            
            util.alert("MTurk Code", "Please input this code into the MTurk HIT to tie your session with your answers." , hash3);
            ide.mturk = hash3;
        },
        
    
//        hook : function(){
//            var _self = this;
//
//            commands.addCommand({
//                name : "unl_keygen",
//                bindKey : {mac: "Shift-Command-J", win: "Ctrl-Shift-J"},
//                hint: "generate key for MTurk",
//                isAvailable : function(editor){
//                    return true;
//                },
//                exec : function(){
//                    ext.initExtension(_self);
//                    _self.winKeygen.show();
//                }
//            });
//
//            this.nodes.push(
//                menus.addItemByPath("Tools/Generate MTurkKey", new apf.item({
//                    command : "unl_keygen"
//                }), 500)
//            );
//
//        },

        clearLog: function() {
            _logEvents = [];
            this.saveLog();
        },

        destroy : function(){
            commands.removeCommandByName("unl_keygen");
            this.winKeygen.destroy(true, true);
            this.$destroy();
        },
        
        saveLog: function() {
            var log = "";
            for (var i = 0; i < _logEvents.length; i++) {
                log += i + " " + _logEvents[i].when.toISOString() + " " + JSON.stringify(_logEvents[i]) + "\n";
            }
            filesystem.saveFile(logpath, log, function(data, state, extra) {});
        },

        logEvent: function(logEvent) {
            
            if (ide.mturk) {
                logEvent.who = ide.mturk;
            }
            logEvent.when = new Date();
            _logEvents.push(logEvent);

            this.saveLog();
        }
    });
});