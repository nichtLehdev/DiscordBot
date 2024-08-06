(function ($) {
  // ################ psImgDnld ################

  var psImgDnld = {
    URL_PATH: PS.app.pvGet("custom_path") ? PS.app.pvGet("custom_path") : "",
    M_DELAY: 200,
    param: null,
    win: null,
    dl_hash: null,

    init: function (options) {},

    setContent: function (str, title) {
      if (title) psImgDnld.win.dialog("option", "title", title);
      $("#psImgDnldWin").html(str);
    },

    _iframeCB: function () {
      var doc;
      try {
        doc = window.frames["dliFrame"].document;
      } catch (e) {}

      if (!doc) return;

      var errTag = $("#ps_errtpl_msg", doc);

      if (errTag.length) {
        psApp.error(errTag.html());
      } else if ($("FORM[name=loginForm]", doc).length) {
        alert(
          "You need to be logged in to download this image. Please try again."
        );
        psimgDnld.cancel();
      }
    },

    _startDlMonitor: function () {
      psImgDnld.f_halt_monitor = false;

      var p = {
        _ACT: "dlStatus",
        dlhsh: psImgDnld.dl_hash,
      };
      psApp.bsapi
        .post("/ajax/1.0/acsAct", p)
        .done(function (d) {
          if (!d.status) {
            psApp.busy(false);
            psImgDnld.cancel();
          } else if (!psImgDnld.f_halt_monitor) setTimeout(psImgDnld._startDlMonitor, psImgDnld.M_DELAY);
        })
        .fail(function () {
          psApp.busy(false);
        });
    },

    _stopDLMonitor: function () {
      this.f_halt_monitor = true;
      $("#dliFrame").attr("src", "about:blank");
    },

    _clickCB: function (evt) {
      var target = $(this);

      switch (target.data("act")) {
        case "showLogin":
          psImgDnld.showLogin();
          break;
        case "dl":
          evt.preventDefault();

          var obj = $("#dliFrame");

          if (obj.length) {
            obj.off("load", psImgDnld._iframeCB);
            obj.remove();
          }
          obj = $(
            '<iframe frameBorder="0" scrolling="no" name="dliFrame" id="dliFrame" style="visibility:hidden;"></iframe>'
          )
            .appendTo("body")
            .on("load", psImgDnld._iframeCB);

          psApp.busy(true);
          obj.attr("src", target.attr("href"));
          setTimeout(psImgDnld._startDlMonitor, psImgDnld.M_DELAY);
      }
    },

    _submitCB: function (evt) {
      evt.preventDefault();
      var param = psImgDnld.param;

      var p = {
        _ACT: "acsPasswd",
        AR_PASSWD: $(this).find("INPUT[name='AR_PASSWD']").val(),
      };

      if (isset(param.C_ID)) p.C_ID = param.C_ID;
      if (isset(param.G_ID)) p.G_ID = param.G_ID;

      psApp.bsapi.post("/ajax/1.0/acsAct", p).done(function (d) {
        psImgDnld.open();
      });
    },

    showAcs: function (modeA) {
      var t;

      if (modeA.passwd) {
        t = "<p>This gallery requires a password to download images.</p>";
        t += '<form style="margin-top: 10px;" method="post">';
        t +=
          '<label>Password:</label> <input type="password" name="AR_PASSWD">';

        t += "<div class='psDialogFooter'><table><tr>";

        if (modeA.login)
          t +=
            "<td><a href='javascript: void(0)' data-act='showLogin'>Have an account? Log in.</a></td>";

        t += "<td><input class='f_right' type='submit' value='Submit'>";
        t += "</td></tr></table></div>";
        t += "</form>";

        psImgDnld.setContent(t, "Download Image");
      } else if (modeA.login) {
        psImgDnld.showLogin();
      }
    },

    showLogin: function () {
      psImgDnld.win.dialog("close");
      var msg = !empty(psImgDnld.param.opt.loginMsg)
        ? psImgDnld.param.opt.loginMsg
        : "Please log in to access image downloads.";
      psApp.login(msg).done(function () {
        psImgDnld.open();
      });
    },

    load: function (d, param) {
      var t,
        str = "";

      var f_hr = !empty(d.dl_hr);
      var f_lr = d.dl_lr == "t";

      if (!isset(param.opt)) param.opt = {};

      // check for no options
      if (
        (param.opt.f_hr && !f_hr) ||
        (param.opt.f_lr && !f_lr) ||
        (!param.opt.f_lr && !param.opt.f_hr && !f_lr && !f_hr)
      ) {
        d.acs_mode = { login: true, passwd: false };
        if (!empty(d.acs_mode)) {
          psImgDnld.showAcs(d.acs_mode);
          return;
        } else {
          var contactUrl = this.URL_PATH + "/contact?I_ID=" + d.img.I_ID;
          if (!(t = param.opt.inviteMsg)) {
            t = 'Please <a href="' + contactUrl + '"><b>contact ';
            t += PS.app.pvGet("custom_id") ? "us" : "the image owner";
            t += "</b></a> for download access to this image.";
          }

          psImgDnld.setContent(t, "Download Unavailable");
          return;
        }
      }

      // necessary to prevent problems with slashes!
      var re = /[^[0-9a-zA-Z._]+/g;

      var fname = d.img.I_FILE_NAME.replace(re, "-");
      var url = this.URL_PATH + "/dnld-hires/" + escape(fname) + "?";
      var url_dl = url;

      this.dl_hash = d.dl_hash;

      url += "dl_id=" + d.dl_id + "&dlhsh=" + escape(d.dl_hash);
      url += "&I_ID=" + param.I_ID;

      // NOTE: gal/clc context removed for superset behavior
      //if (param.C_ID) url += '&C_ID=' + param.C_ID;
      //if (param.G_ID) url += '&G_ID=' + param.G_ID;

      url_dl += "I_ID=" + param.I_ID + "&_ACT=dllr";

      // automatically download hi-res if only one size available
      /*
		if (param.opt.f_hr && !empty(d.dl_hr) && _bsArr.length(d.dl_hr) == 1) {
			var i;
			for (var i in d.dl_hr);
			if (confirm('Download this image?'))
				location = url + '&_ACT=dlhr&DLTYPE=' + i;
			return false;
		}
		*/

      str += '<div class="dlpImg">';
      str += '<img src="' + PS.app.imgGet(d.img.I_ID, "t/150", "img") + '">';
      str += _bsStr.truncate(PS.utl.tplescape(d.img.I_FILE_NAME), 25);
      str += "</div>";

      str += '<div class="f_left" style="width:260px;">';
      str += '<div class="dlpHeader">Available Download Options</div>';

      if (d.dl_lr == "t") {
        // check if lo-res was requested
        /*
			if (param.opt.f_lr) {
				if (confirm('Download a low-resolution preview of this image?'))
					location = url_lr;
				return false;
			}
			*/

        // don't display low-res option if hi-res was requested
        if (!param.opt.f_hr) {
          str += '<div class="dlpList">';
          str +=
            '<h4>Low-Res Comp Download:</h4><ul><li>&raquo; <a href="' +
            url_dl +
            '" data-act="dl">500 pixels (may be watermarked)</a></li></ul>';
          str += "</div>";
        }
      }

      if (!empty(d.dl_hr) && !param.opt.f_lr) {
        var sz = d.img.I_WIDTH + "x" + d.img.I_HEIGHT;
        str += '<div class="dlpList">';
        str += "<h4>Download:</h4>";
        str += "<ul>";
        for (var i in d.dl_hr) {
          str +=
            '<li>&raquo; <a href="' +
            url +
            "&_ACT=dlhr&_EXEC=t&DLTYPE=" +
            i +
            '" data-act="dl">';
          str += d.dl_hr[i];
          if (i == "ORIG|e" || i == "JPG|e") str += " (" + sz + ")";
          str += "</a></li>";
        }
        str += "</ul>";
        str += "</div>";
      }

      str += "</div>";
      str += '<div class="clear"></div>'; //<iframe height="0" width="0" border="0" />';

      psImgDnld.setContent(str, "Download Image");

      return true;
    },

    open: function (param) {
      var loadStr =
        '<div class="psWaitingMd"><img src="/img/icon/ajax-loader-medium.gif" border="0">&nbsp&nbsp;Please wait.</div>';

      if (param) {
        if (typeof param == "string") param = eval("(" + param + ")");
        this.param = param;
      } else param = this.param;

      if (!param) return;

      if (!psImgDnld.win) {
        //set up the content divs
        psImgDnld.win = $('<div id="psImgDnldWin">' + loadStr + "</div>");

        psImgDnld.win.dialog({
          position: "center",
          resizable: false,
          resize: "auto",
          autoOpen: true,
          modal: true,
          stack: false,
          width: 500,
          height: "auto",
          title: "Download Image",
          dialogClass: "ps",
        });
      } else {
        psImgDnld.setContent(loadStr, "Download Image");
        psImgDnld.win.dialog("open");
      }

      var p = { _ACT: "imgDlPerm", I_ID: param.I_ID };
      if (isset(param.C_ID)) p.C_ID = param.C_ID;
      if (isset(param.G_ID)) p.G_ID = param.G_ID;

      psApp.bsapi.post("/ajax/1.0/acsAct", p).done(function (d) {
        psImgDnld.load(d, param);

        $("#psImgDnldWin")
          .on("click", 'A, BUTTON, INPUT[type="submit"]', psImgDnld._clickCB)
          .on("submit", "FORM", psImgDnld._submitCB);
      });
    },

    cancel: function () {
      psImgDnld.win.dialog("close");
    },
  };

  $(document).on("click", "A.psImgDnldLink", function () {
    psImgDnld.open($(this).data("img-dnld"));
  });

  // cleanup - retrofit with _bslt.mm later?
  $(window).unload(function () {
    psImgDnld = null;
  });
})(ps$);
