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

    module.exports = ext.register("ext/unl_keygen/unl_keygen", {
        name     : "MTurk Key Generator",
        dev      : "rleano @ UNL",
        alone    : true,
        type     : ext.GENERAL,
        markup   : markup,

        nodes : [],

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
            
            var fskui = require('fs');
            fskui.appendFile(ide.workspaceDir + "/.mturkid", ide.uid + " :: " + hash3 + "\n", function(err){ 
                if (err) {
                    console.log(err);
                }
            });
            
            util.alert("MTurk Code", "Please input this code into the MTurk HIT to tie your session with your answers." , hash3);
            ide.mturk = hash3;
        },
        
        

        hook : function(){
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
        },

        init : function(amlNode){
            this.winKeygen = winKeygen;
        },

        destroy : function(){
            commands.removeCommandByName("unl_keygen");
            this.winKeygen.destroy(true, true);
            this.$destroy();
        }
    });

});