define([ "dojo/_base/declare", "dojo/_base/connect", "dojo/_base/lang", "dojo/dom-construct", "dojo/string" ],
  function(declare, conn, lang, construct, string) {
    return declare([], {
      constructor: function(args) {
        lang.mixin(this, args);
        // used as a handle for timer to hide the tip
        this._timer = null;
        this._tip = null; 
        lang.hitch(this, this.clearTimer);
        lang.hitch(this, this.hideInfo);
        lang.hitch(this, this.showInfo);
      },
      clearTimer: function() {
        clearTimeout(this._timer);
      },
      hideInfo: function() {
        var that = this; // use lang.partial instead?
        // setTimeout to delay something that might interfere with UX == good
        // setTimeout to wait for an async task to finish == bad
        this._timer = setTimeout(function() {
          // construct.destroy(that._tip);
          // that._tip = null;
          that._tip.innerHTML = "";
          // console.log("hide info timer ran, ", construct, this);
        }, 100);
      },
      showInfo: function(e) {
        if ( !e ) { return; }

        this.clearTimer();
        var atts = e.graphic.attributes;
        var tipContent = string.substitute(this.format, atts);

        if ( this._tip ) {
          this._tip.innerHTML = tipContent;
          return;
        }

        this._tip = construct.create("div", {
          "class": "tip", 
          "innerHTML": tipContent
        }, this.node);
        conn.connect(this._tip, "onmouseover", this, this.clearTimer);
        conn.connect(this._tip, "onmouseout", this, this.hideInfo);
      }
    });
  }
);