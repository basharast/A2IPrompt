/**
 * Developer: Bashar Astifan 2023
 * Link: https://github.com/basharast
 */

var stringToColor = (string, saturation = 90, lightness = 55) => {
    let hash = b_crc32(string);
    return `hsl(${(hash % 360)}, ${saturation}%, ${lightness}%)`;
}

var stringToNegativeColor = (string, saturation = 65, lightness = 55) => {
    let hash = b_crc32(string);
    return `hsl(${(hash % 50)}, ${saturation}%, ${lightness}%)`;
}

function colorByHashCode(stream) {
    var color = "dummy-color:" + stringToColor(stream[0]);
    return color;
}

function colorNegativeByHashCode(stream) {
    var color = "dummy-color:" + stringToNegativeColor(stream[0]);
    return color;
}



CodeMirror.defineSimpleMode("prompt-positive", {
    // The start state contains the rules that are initially used
    start: [
        // The regex matches the token, the token property contains the type
        { regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string" },
        // You can match multiple tokens at once. Note that the captured
        // groups must span the whole string in this case
        { regex: /<(?!lora|lyco).*?>/, token: "textinv" },
        { regex: /UnrealisticDream|FastNegativeV2|EasyNegativeV2|FastNegative|EasyNegative|BadDream|bad_pictures|bad_artist|bad_prompt|bad_hands|bad_hand|bad_antomy/, token: "textinv" },
        {
            regex: /(withLora)\((.*?,)/,
            token: ["lora", "lora-file"]
        },
        {
            regex: /(lora:)(.*?:)/,
            token: ["lora", "lora-file"]
        },
        {
            regex: /(lyco:)(.*?:)/,
            token: ["lora", "lora-file"]
        },
        {
            regex: /(?<!\w)(bright|colorful|cool|dark|deep|dusky|light|warm|iridescent|translucent)(?!\w)/,
            token: "color"
        },
        {
            regex: /(?<!\w)(candlelight|cinematic lighting|fire light|diffused|dramatic|soft lighting|neon lights|reflection|refraction|volumetric lighting)(?!\w)/,
            token: "lighting"
        },
        {
            regex: /(?<!\w)(brass|crystal|earth|glass|iron|magma|marble|porcelain|wood)(?!\w)/,
            token: "material"
        },
        {
            regex: /(?<!\w)(3d render|digital illustration|oil painting|pastel drawing|pencil sketch|pen and ink|sculpture|watercolor painting)(?!\w)/,
            token: "medium"
        },
        {
            regex: /(?<!\w)(backlighting|bloom|bokeh|broad light|chromatic aberration|shallow|deep depth of field|depth of field|fish-eye|smooth|sharp|shallow focus|god rays, sun rays, sun shafts|HDR|RAW color|wide-angle|tilt-shift|tone-mapped)(?!\w)/,
            token: "photography"
        },
        {
            regex: /(?<!\w)(4k|8k|exquisite|fine detail|best quality|low quality|lowres|normal quality|worst quality|highly detailed|masterpiece|Octane render|realistic|Unreal Engine)(?!\w)/,
            token: "quality"
        },
        {
            regex: /(?<!\w)(abstract|art nouveau|classical|gothic|graffiti|hyperrealism|modernism|realistic|surreal|photorealistic)(?!\w)/,
            token: "style"
        },
        {
            regex: /(?<!\w)(ancient|cyberpunk|futuristic|isometric|lush|medieval)(?!\w)/,
            token: "subject"
        },
        // Rules are matched in the order in which they appear, so there is
        // no ambiguity between this one and the one above
        {
            regex: /(?:function|var|return|if|for|while|else|do|this)\b/,
            token: "keyword"
        },
        { regex: /true|false|null|undefined/, token: "atom" },
        {
            regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i,
            token: "number"
        },
        { regex: /\/\/.*/, token: "comment" },
        { regex: /\/(?:[^\\]|\\.)*?\//, token: "variable-3" },
        // A next property will cause the mode to move to a different state
        { regex: /\/\*/, token: "comment", next: "comment" },
        { regex: /[\/*=!]+/, token: "operator" },
        { regex: /[\(\)\+]+/, token: "operator-2" },
        { regex: /[\[\]\-]+/, token: "decrease-1" },
        { regex: /[\{\}]+/, token: "medium-1" },
        { regex: /[a-zA-Z][a-zA-Z0-9]*/, token: colorByHashCode },
        // indent and dedent properties guide autoindentation
        { regex: /[\{\[\(]/, indent: true },
        { regex: /[\}\]\)]/, dedent: true },
        { regex: /[a-z$][\w$]*/, token: "variable" },
        // You can embed other modes with the mode property. This rule
        // causes all code between << and >> to be highlighted with the XML
        // mode.
        { regex: /<</, token: "meta", mode: { spec: "xml", end: />>/ } }
    ],
    // The multi-line comment state.
    comment: [
        { regex: /.*?\*\//, token: "comment", next: "start" },
        { regex: /.*/, token: "comment" }
    ],
    // The meta property contains global information about the mode. It
    // can contain properties like lineComment, which are supported by
    // all modes, and also directives like dontIndentStates, which are
    // specific to simple modes.
    meta: {
        dontIndentStates: ["comment"],
        lineComment: "//"
    }
});


CodeMirror.defineSimpleMode("prompt-negative", {
    // The start state contains the rules that are initially used
    start: [
        // The regex matches the token, the token property contains the type
        { regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string" },
        // You can match multiple tokens at once. Note that the captured
        // groups must span the whole string in this case
        { regex: /<(?!lora|lyco).*?>/, token: "textinv" },
        { regex: /UnrealisticDream|FastNegativeV2|EasyNegativeV2|FastNegative|EasyNegative|BadDream|bad_pictures|bad_artist|bad_prompt|bad_hands|bad_hand|bad_antomy/, token: "textinv" },
        {
            regex: /(withLora)\((.*?,)/,
            token: ["lora", "lora-file"]
        },
        {
            regex: /(lora:)(.*?:)/,
            token: ["lora", "lora-file"]
        },
        {
            regex: /(lyco:)(.*?:)/,
            token: ["lora", "lora-file"]
        },
        {
            regex: /(?<!\w)(4k|8k|exquisite|fine detail|best quality|low quality|lowres|normal quality|worst quality|highly detailed|masterpiece|Octane render|realistic|Unreal Engine)(?!\w)/,
            token: "quality"
        },
        // Rules are matched in the order in which they appear, so there is
        // no ambiguity between this one and the one above
        {
            regex: /(?:function|var|return|if|for|while|else|do|this)\b/,
            token: "keyword"
        },
        { regex: /true|false|null|undefined/, token: "atom" },
        {
            regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i,
            token: "number"
        },
        { regex: /\/\/.*/, token: "comment" },
        { regex: /\/(?:[^\\]|\\.)*?\//, token: "variable-3" },
        // A next property will cause the mode to move to a different state
        { regex: /\/\*/, token: "comment", next: "comment" },
        { regex: /[\/*=!]+/, token: "operator" },
        { regex: /[\(\)]+/, token: "operator-2" },
        { regex: /[a-zA-Z][a-zA-Z0-9]*/, token: colorNegativeByHashCode },
        { regex: /[\(\)\+]+/, token: "operator-2" },
        { regex: /[\[\]\-]+/, token: "decrease-1" },
        { regex: /[\{\}]+/, token: "medium-1" },
        // indent and dedent properties guide autoindentation
        { regex: /[\{\[\(]/, indent: true },
        { regex: /[\}\]\)]/, dedent: true },
        { regex: /[a-z$][\w$]*/, token: "variable" },
        // You can embed other modes with the mode property. This rule
        // causes all code between << and >> to be highlighted with the XML
        // mode.
        { regex: /<</, token: "meta", mode: { spec: "xml", end: />>/ } }
    ],
    // The multi-line comment state.
    comment: [
        { regex: /.*?\*\//, token: "comment", next: "start" },
        { regex: /.*/, token: "comment" }
    ],
    // The meta property contains global information about the mode. It
    // can contain properties like lineComment, which are supported by
    // all modes, and also directives like dontIndentStates, which are
    // specific to simple modes.
    meta: {
        dontIndentStates: ["comment"],
        lineComment: "//"
    }
});

var globalNegativeOpen = false;
CodeMirror.defineSimpleMode("prompt-invokeai", {
    // The start state contains the rules that are initially used
    start: [
        // The regex matches the token, the token property contains the type
        { regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string" },
        // You can match multiple tokens at once. Note that the captured
        // groups must span the whole string in this case
        {
            regex: /(withLora)\((.*?,)/,
            token: ["lora", "lora-file"]
        },
        {
            regex: /(lora:)(.*?:)/,
            token: ["lora", "lora-file"]
        },
        {
            regex: /(lyco:)(.*?:)/,
            token: ["lora", "lora-file"]
        },
        // Rules are matched in the order in which they appear, so there is
        // no ambiguity between this one and the one above
        {
            regex: /(?:function|var|return|if|for|while|else|do|this)\b/,
            token: "keyword"
        },
        { regex: /true|false|null|undefined/, token: "atom" },

        { regex: /\/\/.*/, token: "comment" },
        { regex: /\/(?:[^\\]|\\.)*?\//, token: "variable-3" },
        // A next property will cause the mode to move to a different state
        { regex: /\/\*/, token: "comment", next: "comment" },
        { regex: /[\(\)\+]+/, token: "operator-2" },
        {
            regex: /[a-zA-Z\[\]][a-zA-Z0-9]*/, token: function (stream) {
                var matchesOpen = stream[0].matchAll(/\[/g);
                var matchesClose = stream[0].matchAll(/\]/g);
                if ([...matchesOpen].length) {
                    globalNegativeOpen = true;
                    return "decrease-1";
                } else if ([...matchesClose].length) {
                    globalNegativeOpen = false;
                    return "decrease-1";
                }
                var tokenColor = colorByHashCode(stream);
                if (globalNegativeOpen) {
                    tokenColor = colorNegativeByHashCode(stream);
                }
                return tokenColor;
            }
        },
        { regex: /[\[\]\-]+/, token: "decrease-1" },
        {
            regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i,
            token: "number"
        },
        { regex: /[-+\/*=<>!]+/, token: "operator" },
        // indent and dedent properties guide autoindentation
        { regex: /[\{\[\(]/, indent: true },
        { regex: /[\}\]\)]/, dedent: true },
        { regex: /[a-z$][\w$]*/, token: "variable" },
        // You can embed other modes with the mode property. This rule
        // causes all code between << and >> to be highlighted with the XML
        // mode.
        { regex: /<</, token: "meta", mode: { spec: "xml", end: />>/ } }
    ],
    // The multi-line comment state.
    comment: [
        { regex: /.*?\*\//, token: "comment", next: "start" },
        { regex: /.*/, token: "comment" }
    ],
    // The meta property contains global information about the mode. It
    // can contain properties like lineComment, which are supported by
    // all modes, and also directives like dontIndentStates, which are
    // specific to simple modes.
    meta: {
        dontIndentStates: ["comment"],
        lineComment: "//"
    }
});