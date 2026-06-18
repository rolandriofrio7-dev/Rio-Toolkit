// ============================================================
//  RIO FLOW v3.1 — Interactive Easing Panel for After Effects
//
//  FIX in 3.1:
//    canvas.notify("onDraw") is NOT supported in AE 2024/2026.
//    Replaced with window.update() / panel.update() which
//    forces a full repaint and works in every AE version.
//
//  INSTALL:
//    Mac: /Applications/Adobe After Effects [ver]/Scripts/ScriptUI Panels/
//    Win: C:\Program Files\Adobe After Effects [ver]\Support Files\Scripts\ScriptUI Panels\
//    Restart AE → Window > Rio_Flow.jsx
// ============================================================

(function (thisObj) {

    var VERSION = "3.1";

    // ============================================================
    //  COLORS
    // ============================================================
    var C = {
        bg:           [0.118, 0.118, 0.137],
        curveBg:      [0.060, 0.060, 0.078],
        accent:       [0.278, 0.561, 1.000],
        accentGreen:  [0.220, 0.820, 0.510],
        accentOrange: [1.000, 0.550, 0.180],
        textPrimary:  [0.920, 0.922, 0.961],
        textSecondary:[0.580, 0.580, 0.640],
        textDim:      [0.360, 0.360, 0.410],
        border:       [0.200, 0.200, 0.250],
        curveStroke:  [1.000, 1.000, 1.000],
        handleLine:   [0.800, 0.650, 0.150],
        handleDot:    [0.980, 0.780, 0.100],
        gridLine:     [0.150, 0.150, 0.190],
        refLine:      [0.280, 0.280, 0.340],
        curveShadow:  [0.100, 0.250, 0.600],
    };

    // ============================================================
    //  CURVE STATE  (all values 0..1 normalized)
    //  cx1/cy1 = ease-in control point
    //  cx2/cy2 = ease-out control point
    // ============================================================
    var curve = { cx1: 0.25, cy1: 0.10, cx2: 0.75, cy2: 0.90 };

    // ============================================================
    //  PRESETS
    // ============================================================
    var PRESETS = [
        { name:"Ease",        cx1:0.25, cy1:0.10, cx2:0.75, cy2:0.90, inInfl:33,  outInfl:33,  inSpd:0,    outSpd:0   },
        { name:"Ease In",     cx1:0.42, cy1:0.00, cx2:0.58, cy2:1.00, inInfl:66,  outInfl:20,  inSpd:0,    outSpd:0   },
        { name:"Ease Out",    cx1:0.10, cy1:0.00, cx2:0.90, cy2:1.00, inInfl:20,  outInfl:66,  inSpd:0,    outSpd:0   },
        { name:"Quad In",     cx1:0.55, cy1:0.00, cx2:0.45, cy2:1.00, inInfl:55,  outInfl:10,  inSpd:0,    outSpd:0   },
        { name:"Quad Out",    cx1:0.10, cy1:0.00, cx2:0.90, cy2:1.00, inInfl:10,  outInfl:55,  inSpd:0,    outSpd:0   },
        { name:"Cubic In",    cx1:0.75, cy1:0.00, cx2:0.25, cy2:1.00, inInfl:75,  outInfl:10,  inSpd:0,    outSpd:0   },
        { name:"Cubic Out",   cx1:0.10, cy1:0.00, cx2:0.90, cy2:1.00, inInfl:10,  outInfl:75,  inSpd:0,    outSpd:0   },
        { name:"Expo In",     cx1:0.90, cy1:0.00, cx2:0.10, cy2:1.00, inInfl:90,  outInfl:5,   inSpd:0,    outSpd:0   },
        { name:"Expo Out",    cx1:0.05, cy1:0.00, cx2:0.95, cy2:1.00, inInfl:5,   outInfl:90,  inSpd:0,    outSpd:0   },
        { name:"Back In",     cx1:0.80, cy1:-0.20,cx2:0.15, cy2:1.00, inInfl:80,  outInfl:15,  inSpd:-20,  outSpd:0   },
        { name:"Back Out",    cx1:0.15, cy1:0.00, cx2:0.80, cy2:1.20, inInfl:15,  outInfl:80,  inSpd:0,    outSpd:-20 },
        { name:"Bounce-ish",  cx1:0.30, cy1:0.00, cx2:0.60, cy2:1.10, inInfl:30,  outInfl:60,  inSpd:0,    outSpd:30  },
        { name:"Smooth Pop",  cx1:0.20, cy1:0.00, cx2:0.85, cy2:1.00, inInfl:20,  outInfl:85,  inSpd:80,   outSpd:0   },
        { name:"Snappy",      cx1:0.10, cy1:0.00, cx2:0.95, cy2:1.00, inInfl:10,  outInfl:95,  inSpd:100,  outSpd:0   },
        { name:"Overshoot",   cx1:0.20, cy1:0.00, cx2:0.90, cy2:1.20, inInfl:20,  outInfl:90,  inSpd:0,    outSpd:-35 }
    ];

    // ============================================================
    //  BEZIER MATH
    // ============================================================
    var CW = 230, CH = 160, PAD = 18;
    var GW = CW - PAD * 2, GH = CH - PAD * 2;

    function toCanvasX(nx) { return PAD + nx * GW; }
    function toCanvasY(ny) { return PAD + GH - ny * GH; }

    function bezPt(t, p0, p1, p2, p3) {
        var m = 1 - t;
        return m*m*m*p0 + 3*m*m*t*p1 + 3*m*t*t*p2 + t*t*t*p3;
    }

    // ============================================================
    //  DRAW CURVE — called inside canvas.onDraw
    // ============================================================
    function drawCurveOn(g) {
        // Background
        var bgB = g.newBrush(g.BrushType.SOLID_COLOR, C.curveBg, 1);
        g.newPath(); g.rectPath(0, 0, CW, CH); g.fillPath(bgB);

        // Border
        g.newPath();
        g.rectPath(0.5, 0.5, CW - 1, CH - 1);
        g.strokePath(g.newPen(g.PenType.SOLID_COLOR, C.border, 1));

        // Grid
        var gp = g.newPen(g.PenType.SOLID_COLOR, C.gridLine, 1);
        g.newPath();
        for (var i = 1; i < 4; i++) {
            g.moveTo(PAD + GW * i/4, PAD);     g.lineTo(PAD + GW * i/4, PAD + GH);
            g.moveTo(PAD,            PAD + GH * i/4); g.lineTo(PAD + GW, PAD + GH * i/4);
        }
        g.strokePath(gp);

        // Linear reference diagonal
        g.newPath();
        g.moveTo(toCanvasX(0), toCanvasY(0));
        g.lineTo(toCanvasX(1), toCanvasY(1));
        g.strokePath(g.newPen(g.PenType.SOLID_COLOR, C.refLine, 1));

        // Handle arms
        g.newPath();
        g.moveTo(toCanvasX(0),        toCanvasY(0));
        g.lineTo(toCanvasX(curve.cx1), toCanvasY(curve.cy1));
        g.moveTo(toCanvasX(1),        toCanvasY(1));
        g.lineTo(toCanvasX(curve.cx2), toCanvasY(curve.cy2));
        g.strokePath(g.newPen(g.PenType.SOLID_COLOR, C.handleLine, 1));

        // Curve shadow
        var STEPS = 80;
        g.newPath();
        for (var si = 0; si <= STEPS; si++) {
            var st = si / STEPS;
            var sx = bezPt(st, 0, curve.cx1, curve.cx2, 1);
            var sy = bezPt(st, 0, curve.cy1, curve.cy2, 1);
            if (si === 0) g.moveTo(toCanvasX(sx), toCanvasY(sy) + 1);
            else          g.lineTo(toCanvasX(sx), toCanvasY(sy) + 1);
        }
        g.strokePath(g.newPen(g.PenType.SOLID_COLOR, C.curveShadow, 3));

        // Curve main
        g.newPath();
        for (var ci = 0; ci <= STEPS; ci++) {
            var ct = ci / STEPS;
            var cx = bezPt(ct, 0, curve.cx1, curve.cx2, 1);
            var cy = bezPt(ct, 0, curve.cy1, curve.cy2, 1);
            if (ci === 0) g.moveTo(toCanvasX(cx), toCanvasY(cy));
            else          g.lineTo(toCanvasX(cx), toCanvasY(cy));
        }
        g.strokePath(g.newPen(g.PenType.SOLID_COLOR, C.curveStroke, 2));

        // Handle dots (gold)
        var r = 5;
        var dotB = g.newBrush(g.BrushType.SOLID_COLOR, C.handleDot, 1);
        g.newPath(); g.ellipsePath(toCanvasX(curve.cx1)-r, toCanvasY(curve.cy1)-r, r*2, r*2); g.fillPath(dotB);
        g.newPath(); g.ellipsePath(toCanvasX(curve.cx2)-r, toCanvasY(curve.cy2)-r, r*2, r*2); g.fillPath(dotB);

        // Endpoint dots (white)
        var ep = g.newBrush(g.BrushType.SOLID_COLOR, [0.9,0.9,0.9], 1);
        var er = 3;
        g.newPath(); g.ellipsePath(toCanvasX(0)-er, toCanvasY(0)-er, er*2, er*2); g.fillPath(ep);
        g.newPath(); g.ellipsePath(toCanvasX(1)-er, toCanvasY(1)-er, er*2, er*2); g.fillPath(ep);
    }

    // ============================================================
    //  AE — APPLY EASING
    // ============================================================
    var applyMode = "all";

    function applyEasingToAE(inInfl, outInfl, inSpd, outSpd) {
        // Use direct preset values if supplied, otherwise derive from sliders
        var ii  = (inInfl  !== undefined) ? inInfl  : Math.max(0.1, Math.min(100, Math.round(curve.cx1 * 100)));
        var oi  = (outInfl !== undefined) ? outInfl : Math.max(0.1, Math.min(100, Math.round((1 - curve.cx2) * 100)));
        var isp = (inSpd   !== undefined) ? inSpd   : 0;
        var osp = (outSpd  !== undefined) ? outSpd  : 0;

        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            alert("Rio Flow\n\nNo active composition.\nClick inside your comp first.");
            return false;
        }
        var layers = comp.selectedLayers;
        if (!layers || layers.length === 0) {
            alert("Rio Flow\n\nNo layers selected.\nClick a layer in the timeline first.");
            return false;
        }

        var applied = 0;
        app.beginUndoGroup("Rio Flow: Apply Easing");

        for (var li = 0; li < layers.length; li++) {
            var props = [];
            collectProps(layers[li], props);
            for (var pi = 0; pi < props.length; pi++) {
                var prop = props[pi];
                var nk = 0;
                try { nk = prop.numKeys; } catch(e) { continue; }
                if (nk === 0) continue;

                for (var ki = 1; ki <= nk; ki++) {
                    var doIt = false;
                    if (applyMode === "all") {
                        doIt = true;
                    } else if (applyMode === "selected") {
                        try { doIt = prop.keySelected(ki); } catch(e) {}
                    } else if (applyMode === "current") {
                        try {
                            doIt = Math.abs(prop.keyTime(ki) - comp.time) <= (1 / comp.frameRate) * 1.5;
                        } catch(e) {}
                    }
                    if (!doIt) continue;

                    try {
                        var eIn  = new KeyframeEase(isp, ii);
                        var eOut = new KeyframeEase(osp, oi);
                        var dim  = 1;
                        try { var v = prop.value; if (v && v.length) dim = v.length; } catch(e) {}
                        var ia = [], oa = [];
                        for (var d = 0; d < dim; d++) { ia.push(eIn); oa.push(eOut); }
                        prop.setTemporalEaseAtKey(ki, ia, oa);
                        applied++;
                    } catch(e) {}
                }
            }
        }

        app.endUndoGroup();

        if (applied === 0) {
            alert("Rio Flow\n\nNo keyframes found.\n\n" +
                  "Make sure:\n" +
                  "  1. A layer is selected in the timeline\n" +
                  "  2. That layer has at least 2 keyframes\n" +
                  "  3. Apply Mode is set to 'All Keys'\n\n" +
                  "Press U on a selected layer to reveal its keyframes.");
            return false;
        }
        return true;
    }

    function collectProps(pg, results) {
        var n = 0; try { n = pg.numProperties; } catch(e) { return; }
        for (var i = 1; i <= n; i++) {
            var p; try { p = pg.property(i); } catch(e) { continue; }
            if (!p) continue;
            var grp = false; try { grp = p.numProperties > 0; } catch(e) {}
            if (grp) collectProps(p, results);
            else { var nk = 0; try { nk = p.numKeys; } catch(e) {} if (nk > 0) results.push(p); }
        }
    }

    // ============================================================
    //  UI HELPERS
    // ============================================================
    function setFG(el, col) {
        try { el.graphics.foregroundColor = el.graphics.newPen(el.graphics.PenType.SOLID_COLOR, col, 1); } catch(e) {}
    }
    function setFont(el, sty, sz) {
        try { el.graphics.font = ScriptUI.newFont("Arial", sty, sz); } catch(e) {}
    }
    function hr(par, t, b) {
        var w = par.add("group");
        w.orientation = "row"; w.alignChildren = ["fill","center"];
        w.margins = [0, t||2, 0, b||2];
        w.add("panel").alignment = "fill";
    }
    function secHead(par, txt, col) {
        var g = par.add("group");
        g.orientation = "row"; g.alignChildren = ["left","center"];
        g.margins = [14,7,14,3]; g.spacing = 6;
        var bar = g.add("statictext", undefined, "\u258C");
        setFont(bar,"BOLD",11); setFG(bar, col||C.accent);
        var lbl = g.add("statictext", undefined, txt.toUpperCase());
        setFont(lbl,"BOLD",9); setFG(lbl, C.textSecondary);
    }

    // ============================================================
    //  BUILD UI
    // ============================================================
    function buildUI(root) {

        root.orientation = "column";
        root.alignChildren = ["fill","top"];
        root.spacing = 0; root.margins = 0;

        // Reference to the window for repaint — stored at build time
        // window.update() is the correct cross-version repaint call
        var win = (root instanceof Window) ? root : root.window;

        function repaint() {
            try { win.update(); } catch(e) {}
        }

        // ── TOP ACCENT STRIP
        var strip = root.add("panel");
        strip.alignment = "fill";
        strip.minimumSize = [-1,3]; strip.maximumSize = [-1,3];

        // ── HEADER
        var hRow = root.add("group");
        hRow.orientation = "row"; hRow.alignChildren = ["fill","center"];
        hRow.margins = [14,10,14,10]; hRow.spacing = 9;

        var rioL = hRow.add("statictext", undefined, "RIO");
        setFont(rioL,"BOLD",20); setFG(rioL, C.accent);

        var vd = hRow.add("panel"); vd.preferredSize=[1,28]; vd.minimumSize=[1,28]; vd.maximumSize=[1,28];

        var ts = hRow.add("group"); ts.orientation="column"; ts.alignChildren=["left","center"]; ts.spacing=2;
        var fl = ts.add("statictext", undefined, "FLOW"); setFont(fl,"BOLD",14); setFG(fl, C.textPrimary);
        var sl = ts.add("statictext", undefined, "Easing tools for smoother motion"); setFont(sl,"REGULAR",8); setFG(sl,C.textDim);

        var vl = hRow.add("statictext", undefined, "v"+VERSION);
        vl.alignment=["right","center"]; setFont(vl,"REGULAR",8); setFG(vl,C.textDim);

        hr(root,0,0);

        // ══════════════════════════════════════════
        //  CURVE GRAPH
        // ══════════════════════════════════════════
        secHead(root, "Curve", C.accent);

        var graphSec = root.add("group");
        graphSec.orientation = "column"; graphSec.alignChildren = ["fill","top"];
        graphSec.margins = [12,2,12,4]; graphSec.spacing = 6;

        // Canvas — group with onDraw
        var canvas = graphSec.add("group");
        canvas.preferredSize = [CW,CH]; canvas.minimumSize = [CW,CH]; canvas.maximumSize = [CW,CH];
        canvas.helpTip = "Curve shape — adjust sliders below to reshape";

        canvas.onDraw = function () { drawCurveOn(this.graphics); };

        // Numeric readout
        var readoutRow = graphSec.add("group");
        readoutRow.orientation="row"; readoutRow.alignChildren=["fill","center"]; readoutRow.spacing=4;
        var readLbl = readoutRow.add("statictext", undefined, "");
        setFont(readLbl,"REGULAR",9); setFG(readLbl,C.textSecondary);

        function updateReadout() {
            readLbl.text =
                "In: " + curve.cx1.toFixed(2) + ", " + curve.cy1.toFixed(2) +
                "   Out: " + curve.cx2.toFixed(2) + ", " + curve.cy2.toFixed(2);
        }

        // ── SLIDERS — shape the curve without needing mouse drag
        var sliderSec = graphSec.add("group");
        sliderSec.orientation="column"; sliderSec.alignChildren=["fill","top"]; sliderSec.spacing=4;

        function makeSlider(parent, label, initVal, minV, maxV, onChange) {
            var row = parent.add("group");
            row.orientation="row"; row.alignChildren=["fill","center"]; row.spacing=6;
            var lbl = row.add("statictext", undefined, label);
            lbl.preferredSize=[70,16]; setFont(lbl,"REGULAR",8); setFG(lbl,C.textSecondary);
            var sl = row.add("slider", undefined, initVal, minV, maxV);
            sl.preferredSize=[-1,14];
            var vl = row.add("statictext", undefined, initVal.toFixed(2));
            vl.preferredSize=[32,16]; setFont(vl,"REGULAR",8); setFG(vl,C.textDim);
            sl.onChanging = function () {
                var v = Math.round(this.value * 100) / 100;
                vl.text = v.toFixed(2);
                onChange(v);
                updateReadout();
                repaint(); // ← window.update() — works in all AE versions
            };
            return { sl: sl, vl: vl };
        }

        var s1 = makeSlider(sliderSec, "Ease In  X",  curve.cx1, 0,    1,   function(v){ curve.cx1=v; });
        var s2 = makeSlider(sliderSec, "Ease In  Y",  curve.cy1, -0.3, 0.5, function(v){ curve.cy1=v; });
        var s3 = makeSlider(sliderSec, "Ease Out X",  curve.cx2, 0,    1,   function(v){ curve.cx2=v; });
        var s4 = makeSlider(sliderSec, "Ease Out Y",  curve.cy2, 0.5,  1.3, function(v){ curve.cy2=v; });

        function syncSliders() {
            s1.sl.value=curve.cx1; s1.vl.text=curve.cx1.toFixed(2);
            s2.sl.value=curve.cy1; s2.vl.text=curve.cy1.toFixed(2);
            s3.sl.value=curve.cx2; s3.vl.text=curve.cx2.toFixed(2);
            s4.sl.value=curve.cy2; s4.vl.text=curve.cy2.toFixed(2);
            updateReadout();
            repaint();
        }

        // Preset name display
        var pnRow = graphSec.add("group");
        pnRow.orientation="row"; pnRow.alignChildren=["fill","center"]; pnRow.spacing=8;
        var pnLbl = pnRow.add("statictext", undefined, "Ease");
        setFont(pnLbl,"BOLD",10); setFG(pnLbl,C.accent);
        var pdLbl = pnRow.add("statictext", undefined, "33% in / 33% out");
        setFont(pdLbl,"ITALIC",8); setFG(pdLbl,C.textDim);

        // ── BIG APPLY BUTTON
        var applyBtn = graphSec.add("button", undefined, "APPLY");
        applyBtn.preferredSize = [-1, 36];
        setFont(applyBtn,"BOLD",13);
        applyBtn.helpTip = "Apply the current curve to keyframes on selected layer(s)";
        applyBtn.onClick = function () { applyEasingToAE(); };

        hr(root,4,0);

        // ══════════════════════════════════════════
        //  APPLY MODE
        // ══════════════════════════════════════════
        secHead(root, "Apply Mode", C.accentOrange);

        var modeSec = root.add("group");
        modeSec.orientation="column"; modeSec.alignChildren=["fill","top"];
        modeSec.margins=[12,2,12,6]; modeSec.spacing=4;

        var modeLbl = modeSec.add("statictext", undefined,
            "\u25CF  All Keys on Layer  \u2014  recommended");
        setFont(modeLbl,"ITALIC",8); setFG(modeLbl,C.accentOrange);

        var mRow = modeSec.add("group");
        mRow.orientation="row"; mRow.alignChildren=["fill","center"]; mRow.spacing=4;

        var mAll = mRow.add("button", undefined, "All Keys");
        mAll.preferredSize=[-1,22];
        mAll.helpTip="Apply to every keyframe on selected layer(s) — easiest, no diamond clicking needed";

        var mSel = mRow.add("button", undefined, "Selected Keys");
        mSel.preferredSize=[-1,22];
        mSel.helpTip="Apply only to manually selected (yellow) keyframe diamonds";

        var mCur = mRow.add("button", undefined, "At Playhead");
        mCur.preferredSize=[-1,22];
        mCur.helpTip="Apply to keyframes within 1 frame of the current time indicator";

        mAll.onClick = function(){ applyMode="all";      modeLbl.text="\u25CF  All Keys on Layer  \u2014  recommended"; setFG(modeLbl,C.accentOrange); };
        mSel.onClick = function(){ applyMode="selected"; modeLbl.text="\u25CF  Selected Keys Only  \u2014  click diamonds first"; setFG(modeLbl,C.accentGreen); };
        mCur.onClick = function(){ applyMode="current";  modeLbl.text="\u25CF  At Playhead  \u2014  move CTI to a keyframe"; setFG(modeLbl,C.accent); };

        hr(root,4,0);

        // ══════════════════════════════════════════
        //  PRESETS GRID
        // ══════════════════════════════════════════
        secHead(root, "Presets", C.accent);

        var presetSec = root.add("group");
        presetSec.orientation="column"; presetSec.alignChildren=["fill","top"];
        presetSec.margins=[12,2,12,8]; presetSec.spacing=5;

        var COLS=3, BTN_H=24;
        var gRow=null;

        for (var pi=0; pi<PRESETS.length; pi++) {
            if (pi%COLS===0) {
                gRow = presetSec.add("group");
                gRow.orientation="row"; gRow.alignChildren=["fill","center"]; gRow.spacing=5;
            }
            (function(p, row){
                var btn = row.add("button", undefined, p.name);
                btn.preferredSize=[-1,BTN_H];
                btn.helpTip = p.name + " \u2014 loads curve and applies to selected layer";
                btn.onClick = function() {
                    // Load into curve state
                    curve.cx1=p.cx1; curve.cy1=p.cy1;
                    curve.cx2=p.cx2; curve.cy2=p.cy2;
                    syncSliders();
                    pnLbl.text = p.name;
                    pdLbl.text = p.inInfl + "% in / " + p.outInfl + "% out";
                    // Apply immediately using preset's exact influence values
                    applyEasingToAE(p.inInfl, p.outInfl, p.inSpd, p.outSpd);
                };
            })(PRESETS[pi], gRow);
        }
        // Pad last row
        var rem = PRESETS.length % COLS;
        if (rem !== 0 && gRow) {
            for (var sp=0; sp<COLS-rem; sp++) gRow.add("group").preferredSize=[-1,BTN_H];
        }

        hr(root,4,0);

        // ══════════════════════════════════════════
        //  UTILITIES
        // ══════════════════════════════════════════
        secHead(root,"Utilities",C.textSecondary);

        var utilSec = root.add("group");
        utilSec.orientation="column"; utilSec.alignChildren=["fill","top"];
        utilSec.margins=[12,2,12,10]; utilSec.spacing=5;

        var uRow1 = utilSec.add("group");
        uRow1.orientation="row"; uRow1.alignChildren=["fill","center"]; uRow1.spacing=5;

        var eeBtn = uRow1.add("button", undefined, "Easy Ease  (F9)");
        eeBtn.preferredSize=[-1,26];
        eeBtn.helpTip="Symmetric 33% ease on all keyframes — same as F9";
        eeBtn.onClick = function(){
            curve.cx1=0.25; curve.cy1=0.10; curve.cx2=0.75; curve.cy2=0.90;
            syncSliders(); pnLbl.text="Easy Ease"; pdLbl.text="33% in / 33% out";
            applyEasingToAE(33,33,0,0);
        };

        var linBtn = uRow1.add("button", undefined, "Linearize");
        linBtn.preferredSize=[-1,26];
        linBtn.helpTip="Remove all easing — straight linear motion";
        linBtn.onClick = function(){
            curve.cx1=0.33; curve.cy1=0.00; curve.cx2=0.67; curve.cy2=1.00;
            syncSliders(); pnLbl.text="Linear"; pdLbl.text="No easing";
            applyEasingToAE(0.1,0.1,0,0);
        };

        var uRow2 = utilSec.add("group");
        uRow2.orientation="row"; uRow2.alignChildren=["fill","center"]; uRow2.spacing=5;

        var resetBtn = uRow2.add("button", undefined, "Reset Curve");
        resetBtn.preferredSize=[-1,26];
        resetBtn.helpTip="Reset curve to default Ease shape";
        resetBtn.onClick = function(){
            curve.cx1=0.25; curve.cy1=0.10; curve.cx2=0.75; curve.cy2=0.90;
            syncSliders(); pnLbl.text="Ease"; pdLbl.text="33% in / 33% out";
        };

        var saveBtn = uRow2.add("button", undefined, "Save as Custom");
        saveBtn.preferredSize=[-1,26];
        saveBtn.helpTip="Save current curve as a new session button";
        saveBtn.onClick = function(){
            var name = "Custom " + (PRESETS.length + 1);
            var np = { name:name, cx1:curve.cx1, cy1:curve.cy1, cx2:curve.cx2, cy2:curve.cy2,
                       inInfl:Math.round(curve.cx1*100), outInfl:Math.round((1-curve.cx2)*100),
                       inSpd:0, outSpd:0 };
            var sr = utilSec.add("group");
            sr.orientation="row"; sr.alignChildren=["fill","center"]; sr.spacing=4;
            (function(preset){
                var b = sr.add("button", undefined, "\u2605 "+preset.name);
                b.preferredSize=[-1,24];
                b.onClick=function(){
                    curve.cx1=preset.cx1; curve.cy1=preset.cy1;
                    curve.cx2=preset.cx2; curve.cy2=preset.cy2;
                    syncSliders(); pnLbl.text=preset.name;
                    applyEasingToAE(preset.inInfl,preset.outInfl,0,0);
                };
            })(np);
            root.layout.layout(true);
        };

        // ── STATUS BAR
        hr(root,0,0);
        var sb = root.add("group");
        sb.orientation="row"; sb.alignChildren=["fill","center"];
        sb.margins=[14,4,14,5]; sb.spacing=6;
        var dot = sb.add("statictext", undefined, "\u25CF");
        setFont(dot,"REGULAR",7); setFG(dot,C.accentGreen);
        var stl = sb.add("statictext", undefined, "Select a layer \u2014 pick a preset or adjust sliders \u2014 click APPLY");
        setFont(stl,"REGULAR",8); setFG(stl,C.textDim);

        // Initial state
        updateReadout();

        return root;
    }

    // ============================================================
    //  ENTRY POINT
    // ============================================================
    var panel;
    if (thisObj instanceof Panel) {
        panel = thisObj;
        panel.orientation="column"; panel.alignChildren=["fill","top"];
        panel.spacing=0; panel.margins=0;
        buildUI(panel);
        panel.layout.layout(true);
    } else {
        panel = new Window("palette", "Rio Flow  v"+VERSION, undefined, {resizeable:true});
        panel.orientation="column"; panel.alignChildren=["fill","top"];
        panel.spacing=0; panel.margins=0;
        buildUI(panel);
        panel.layout.layout(true);
        panel.center();
        panel.show();
    }

})(this);

// ============================================================
//  HOW TO USE
// ============================================================
//
//  QUICKEST WORKFLOW:
//  1. Click your layer (e.g. Null 1) in the timeline
//  2. Make sure "All Keys" mode is active (orange text, default)
//  3. Click any preset button — applies instantly
//     OR drag sliders to shape curve, then click APPLY
//
//  IMPORTANT — your layer needs at least 2 keyframes.
//  Press U on a selected layer to see its keyframes.
//
//  APPLY MODES:
//  All Keys     — every keyframe on selected layer(s) [default]
//  Selected Keys — only yellow-diamond selected keyframes
//  At Playhead  — keyframes near the current time indicator
//
//  INSTALL:
//  Mac: /Applications/Adobe After Effects [ver]/Scripts/ScriptUI Panels/
//  Win: C:\Program Files\Adobe After Effects [ver]\Support Files\Scripts\ScriptUI Panels\
//  Restart AE → Window > Rio_Flow.jsx
// ============================================================
