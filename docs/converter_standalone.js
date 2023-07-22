/**
 * Developer: Bashar Astifan 2023
 * Link: https://github.com/basharast
 */

//Regarding to tokens counter, I'm using 'encode' function
//This function available at 'encoders/cl100k_base.js', 
//so this file must be included (check index.html). (unless you have something else)

/*****************/
/* MAIN FUNTIONS */
/*****************/
//1- convertAuto1111ToInvokeAI (positive, negative, rawNegative)
//2- convertInvokeAIToAuto1111 (positive, negative, rawNegative)
//3- calculateInvokeAITokens(positive, negative)
//Both functions (1 & 2) below returns object:
/*
    from: {
        positive: { text: , tokens: },
        negative: { text: , tokens: },
    },
    to: {
        positive: { text: , tokens: },
        negative: { text: , tokens: },
    }
*/
//Convert from automatic1111 to invokeai
function convertAuto1111ToInvokeAI(inputPositive, inputNegative, ignoreNegativeParameters = false, invokeAIVersion = 2) {
    var input = {
        positive: inputPositive,
        negative: inputNegative
    };

    invokeaiVersion = invokeAIVersion;

    var targetConversionTable = regexConversionTable.invokeAIRegexPatterns;
    targetConversionTable.forEach(regexPatternItem => {
        var patternRecursive = regexPatternItem.recursiveCheck;
        if (patternRecursive) {
            input = regexValueRecursiveReplace(input, regexPatternItem, ignoreNegativeParameters);
        } else {
            input = regexValueReplace(input, regexPatternItem, ignoreNegativeParameters);
        }
    });

    //Include tokens to the output
    var finalOutput = prepareOutput(input, inputPositive, inputNegative, false);
    return finalOutput;
}

//Convert from invokeai to automatic1111
function convertInvokeAIToAuto1111(inputPositive, inputNegative, ignoreNegativeParameters = false, invokeAIVersion = 2) {
    //It's expected to have negative values within input
    //so it's better to fetch them (if any)
    if (invokeaiVersion < 3) {
        //Version 2 only, 3 doesn't support that
        inputNegative += fetchInvokeAINegatives(inputPositive);
    }

    invokeaiVersion = invokeAIVersion;

    var input = {
        positive: inputPositive,
        negative: inputNegative
    };

    var targetConversionTable = regexConversionTable.auto1111RegexPatterns;
    targetConversionTable.forEach(regexPatternItem => {
        var patternRecursive = regexPatternItem.recursiveCheck;
        if (patternRecursive) {
            input = regexValueRecursiveReplace(input, regexPatternItem, ignoreNegativeParameters);
        } else {
            input = regexValueReplace(input, regexPatternItem, ignoreNegativeParameters);
        }
    });

    //Include tokens to the output
    var finalOutput = prepareOutput(input, inputPositive, inputNegative, true);
    return finalOutput;
}

/***************/
/* ENGINE CORE */
/***************/
//This value suppose to be used with blending case when no weight added
//also it will be used when input has syntax such as '[word]' (online docs says '[]' decrease the strength by a factor of 0.9)
var defaultWeight = 0.91;
var limitWeightPositive = "$1";
var limitWeightNegative = "$1";
var invokeaiVersion = 2;

//Main prompt syntax resolver table
//Be aware that elements order is important, don't change it
//This table support 3 resolve styles:
//1- 'outputRegex' as 'string' repacement including regex expression
//2- 'outputRegex' as 'recursiveCheck' check more details below
//3- 'outputRegex' as 'function (inputText, regexGroups)'
//'inputRegex' expected to be regex expression, it support multiple expressions as array []
var regexConversionTable = {
    //From auto1111 to invokeai key
    invokeAIRegexPatterns: [
        {
            //Blending regex, no limited number for items
            //Supported cases: 
            //1- {word1|word1|...} or {word1@weight|word1@weight|...} or {word1:weight|word1:weight|...} 
            //2- [word1|word1|...] or [word1@weight|word1@weight|...] or [word1:weight|word1:weight|...] 
            //3- (word1|word1|...) or (word1@weight|word1@weight|...) or (word1:weight|word1:weight|...) 
            //the regex check for '(word1|word1|...)' will avoid 'lora' structure, and syntax like '\(word\)' 
            inputRegex: [String.raw`\{([^\}]+)\}`, String.raw`\[([^\]]+)\]`, String.raw`(?<!withLora)\(([^\)(?!\\)]+)\)`],
            //'outputRegex'->'function' style
            outputRegex: function (inputText, regexGroups) {
                for (const match of regexGroups) {
                    var fullMatch = match[0];
                    var innerMatch = match[1];
                    //Check if internal matched value has '|', 
                    //afaik this usualy used in auto1111 to blend multiple elements
                    if (innerMatch.indexOf("|") !== -1) {
                        var groups = innerMatch.split("|");
                        var outputElements = [];
                        groups.forEach(function (groupItem) {
                            var appendValue = "";
                            groupItem = groupItem.trim();
                            //The default weight split is ':', 
                            //but I checked auto111 code and someone also added support for '@' along with '{}'
                            var possibleWeightSplits = ["@", ":"];
                            possibleWeightSplits.forEach(function (splitItem) {
                                if (groupItem.indexOf(splitItem) !== -1) {
                                    var itemData = groupItem.split(splitItem);
                                    var itemText = itemData[0];
                                    var itemWeight = itemData[1];
                                    appendValue = `(${itemText})${itemWeight}`;
                                }
                            });
                            if (appendValue.length == 0) {
                                //This mean no weight specified, 
                                //I used default weight to be used instead, 
                                appendValue = `(${groupItem})${defaultWeight}`;
                            }
                            outputElements.push(appendValue);
                        });
                        //Split array items using ','
                        var blendText = "(" + outputElements.join(", ") + ")";
                        inputText = inputText.replace(fullMatch, blendText);
                    }
                }
                return inputText;
            },
            //Not sure if there is blending in negative prompts
            //but for now I use only the internal match as-is
            outputNegativeRegex: "$1",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "$1",
            recursiveCheck: false
        },
        {
            //Word with weight such as: '(word:weight)' thanks to 'Void2258'
            //https://github.com/invoke-ai/InvokeAI/discussions/3680#discussioncomment-6501175
            inputRegex: [String.raw`(?!\s)\(([a-zA-Z\s\_\-\d]+)[\s]{0,3}\:\s{0,3}([\d\.]+)\)`, String.raw`\(([^)]+)#!(?![\-\+\d])\)\:([\d\.]+)`, String.raw`\(([^)]+)(?![\-\+\d])\,\:([\d\.]+)\)`],
            outputRegex: "{{$1:$2}}", //Expected matches '($1:$2)'=> '{{$1:$2}}' just reform it to avoid attention, it will be solved below
            outputNegativeRegex: "{{$1:$2}}",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "$1",
            recursiveCheck: false
        },
        {
            //Ratio, which will cause blend in v2 because of ':'
            inputRegex: String.raw`(\,\s{0,3}\d{1,2}):(\d{1,2}\s{0,3}\,)`,
            outputRegex: "$1 by $2", //Expected matches '$1:$2'=> '$1 by $2', using ':' will cause blend issue
            outputNegativeRegex: "$1 by $2",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "$1 by $2",
            recursiveCheck: false,
            v3: {
                //Using ':' is fine in v3
                outputRegex: "$1:$2",
                outputNegativeRegex: "$1:$2",
                //Negative raw will be used when user choose to ignore (attention and weight)
                outputNegativeRawRegex: "$1:$2",
            }
        },
        {
            //Not sure this even valid case (I need more info and tests)
            //Attention with weight
            //'!#', '#1', '@' and '!' those will be replaced during 'recursive' process below using 'replacements' list
            //(example if loopCount=4): 
            //1st phase: '((((word)))):weight'
            //2st phase: '(((word))):weight'
            //3rd phase: '((word)):weight'
            //4th phase: '(word):weight'
            //this can be simplified in much deeper regex check, but it works fine for now and it may help in other complicated cases
            inputRegex: [String.raw`!#([^)]+)#!(?![\-\+\d])\:([\d\.]+)`, String.raw`!#([^)]+)(?![\-\+\d])\,\:([\d\.]+)#!`],
            //'outputRegex'->'string, regex' style
            outputRegex: "(($1)$2)@", //@ suppose to be replaced with one '+' or more based on check
            outputNegativeRegex: "(($1)$2)!", //! suppose to be replaced with one '+' or more based on check
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "$1",
            //This will activate 'recursiveCheck' process from 'loopCount' value to 0
            recursiveCheck: true,
            //Replacement guide map so 'recursiveCheck' can use it while checking
            replacementsMap:
            {
                loopCount: 10,
                replacements: [
                    //'output:bool' used to apply replacement on 'false'->'inputRegex' or 'true'->'outputRegex'
                    { target: "!#", replacement: String.raw`\(`, output: false },
                    { target: "#!", replacement: String.raw`\)`, output: false },
                    { target: "@", replacement: "+", output: true },
                    { target: "!", replacement: "+", output: true },
                ]
            },
        },
        {
            //Attention without weight
            //for more description please read 'Attention with weight' above
            //this regex check will avoid 'lora' structure, and syntax like '\(word\)' 
            inputRegex: String.raw`(?<!withLora)!#\(([^)(?!\\)]+)\)#!(?![\-\+\d])`,
            //'inputRegex, outputRegex'->'recursiveCheck' style
            outputRegex: "($1)@", //@ suppose to be replaced with one '+' or more based on check
            outputNegativeRegex: "($1)!", //! suppose to be replaced with one '+' or more based on check
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "$1",
            //This will activate 'recursiveCheck' process from 'loopCount' value to 0
            recursiveCheck: true,
            //Replacement guide map so 'recursiveCheck' can use it while checking
            replacementsMap:
            {
                loopCount: 10,
                replacements: [
                    //'output:bool' used to apply replacement on 'false'->'inputRegex' or 'true'->'outputRegex'
                    { target: "!#", replacement: String.raw`\(`, output: false },
                    { target: "#!", replacement: String.raw`\)`, output: false },
                    { target: "@", replacement: "+", output: true },
                    { target: "!", replacement: "+", output: true },
                ]
            },
        },
        {
            //Weight resolver (Optional)
            //This purely made based on test and not logic
            //weight with values such as 2 is causing bad results
            //it will be forced to custom value by user
            inputRegex: [
                function (negativeMatch = false) {
                    var matchRegex = String.raw`\)(\d+(?:\.\d+)?)\)`;
                    return matchRegex;
                }, function (negativeMatch = false) {
                    var matchRegex = String.raw`\:(\d+(?:\.\d+)?)`;
                    return matchRegex;
                }],
            outputRegex: function (inputText, regexGroups) {
                var limitedValue = limitWeightPositive;
                if (limitedValue.indexOf("$1") === -1) {
                    if (limitedValue.indexOf(".") !== -1) {
                        var splitData = limitedValue.split(".");
                        var first = splitData[0];
                        if (splitData.length > 1 && [...splitData[1].matchAll(/\d+/g)].length) {
                            limitedValue = limitWeightPositive;
                        } else {
                            limitedValue = first;
                        }
                    }
                    for (const match of regexGroups) {
                        var fullMatch = match[0];
                        var innerMatch = match[1];
                        if (parseFloat(innerMatch).toFixed(5) < 9 && (parseFloat(innerMatch).toFixed(5) > parseFloat(limitedValue).toFixed(5))) {
                            var replacement = fullMatch.replace(innerMatch, limitedValue);
                            var innerMatchRegex = fullMatch;
                            innerMatchRegex = innerMatchRegex.replace(/\)/g, String.raw`\)`);
                            innerMatchRegex = String.raw`${innerMatchRegex}(?![\.\d])`;
                            var regexExp = new RegExp(innerMatchRegex, 'g');
                            inputText = inputText.replace(regexExp, replacement);
                        }
                    }
                }
                return inputText;
            }, //Expected matches ':$1'
            outputNegativeRegex: function (inputText, regexGroups) {
                var limitedValue = limitWeightNegative;
                if (limitedValue.indexOf("$1") === -1) {
                    if (limitedValue.indexOf(".") !== -1) {
                        var splitData = limitedValue.split(".");
                        var first = splitData[0];
                        if (splitData.length > 1 && [...splitData[1].matchAll(/\d+/g)].length) {
                            limitedValue = limitWeightNegative;
                        } else {
                            limitedValue = first;
                        }
                    }
                    for (const match of regexGroups) {
                        var fullMatch = match[0];
                        var innerMatch = match[1];
                        if (parseFloat(innerMatch).toFixed(5) < 9 && (parseFloat(innerMatch).toFixed(5) > parseFloat(limitedValue).toFixed(5))) {
                            var replacement = fullMatch.replace(innerMatch, limitedValue);
                            var innerMatchRegex = fullMatch;
                            innerMatchRegex = innerMatchRegex.replace(/\)/g, String.raw`\)`);
                            innerMatchRegex = String.raw`${innerMatchRegex}(?![\.\d])`;
                            var regexExp = new RegExp(innerMatchRegex, 'g');
                            inputText = inputText.replace(regexExp, replacement);
                        }
                    }
                }
                return inputText;
            },
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: ":$1",
            recursiveCheck: false
        },
        {
            //LoRa
            inputRegex: String.raw`\<lora:(.*?):\s{0,3}([\d\.]+)\>`,
            outputRegex: "withLora($1,$2)", //Expected matches '<lora:$1:$2>'
            //I don't think there should be 'lora' in negative prompt, so it will be cleaned if detected
            outputNegativeRegex: "",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "",
            recursiveCheck: false
        },
        {
            //Lyco
            //If I'm not wrong this suppose to use same LoRa function 'withLora'
            inputRegex: String.raw`\<lyco:(.*?):\s{0,3}([\d\.]+)\>`,
            outputRegex: "withLora($1,$2)", //Expected matches '<lyco:$1:$2>'
            //I don't think there should be 'lyco' in negative prompt, so it will be cleaned if detected
            outputNegativeRegex: "",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "",
            recursiveCheck: false
        },
        {
            //Aspect ratio protect to avoid case like aspect ratio 1:1 => (aspect ratio 1)1 which is wrong
            inputRegex: String.raw`aspect ratio (\d):(\d)`,
            outputRegex: "aspect ratio $1 by $2", //I don't know how to solve this in invokeai v2 (using ':' will trigger blending instead) so we just replace ':' with 'by'
            outputNegativeRegex: "aspect ratio $1 by $2",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "aspect ratio $1 by $2",
            recursiveCheck: false,
            v3: {
                //Using ':' is fine in v3
                outputRegex: "aspect ratio $1#$2",
                outputNegativeRegex: "aspect ratio $1#$2",
                //Negative raw will be used when user choose to ignore (attention and weight)
                outputNegativeRawRegex: "aspect ratio $1#$2",
            }
        },
        {
            //Texture inversion with weight
            inputRegex: String.raw`<(?!lora|lyco)(.*?)\:([\d\.]+)>`,
            outputRegex: "$1:$2", //For v2 I think it must be without '<>'
            outputNegativeRegex: "$1:$2",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "$1",
            recursiveCheck: false,
            v3: {
                //Using ':' and '<>' is fine in v3
                outputRegex: "<$1#$2>",
                outputNegativeRegex: "<$1#$2>",
                //Negative raw will be used when user choose to ignore (attention and weight)
                outputNegativeRawRegex: "<$1>",
            }
        },
        {
            //Texture inversion
            inputRegex: String.raw`<(?!lora|lyco)(.*?)>`,
            outputRegex: "$1", //For v2 I think it must be without '<>'
            outputNegativeRegex: "$1",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "$1",
            recursiveCheck: false,
            v3: {
                //Using ':' and '<>' is fine in v3
                outputRegex: "<$1>",
                outputNegativeRegex: "<$1>",
                //Negative raw will be used when user choose to ignore (attention and weight)
                outputNegativeRawRegex: "<$1>",
            }
        },
        {
            //Word with weight such as: 'word:weight'
            inputRegex: [String.raw`(?!\s)\{\{([a-zA-Z\s\_\-\d]{2,50})[\s]{0,3}\:\s{0,3}([\d\.]+)\}\}`, String.raw`(?!\s)([a-zA-Z\s\_\-\d]{2,50})[\s]{0,3}\:\s{0,3}([\d\.]+)`],
            outputRegex: "($1)$2", //Expected matches '$1:$2'
            outputNegativeRegex: "($1)$2",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "$1",
            recursiveCheck: false
        },
        {
            //Aspect ratio protect resolve back (Happens in v3 only)
            inputRegex: String.raw`aspect ratio (\d)#(\d)`,
            outputRegex: "aspect ratio $1:$2",
            outputNegativeRegex: "aspect ratio $1:$2",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "aspect ratio $1:$2",
            recursiveCheck: false,
        },
        {
            //Texture inversion resolve back (Happens in v3 only)
            inputRegex: String.raw`<(?!lora|lyco)(.*?)#([\d\.]+)>`,
            outputRegex: "<$1:$2>",
            outputNegativeRegex: "<$1:$2>",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "<$1>",
            recursiveCheck: false,
        },
        {
            //This regex made for cases like [keyword]
            //as per online docs 'it decrease the strength by a factor of 0.9 and is the same as (keyword:0.9).'
            inputRegex: String.raw`\[([^[]+)\](?![\+\d])`,
            outputRegex: `($1)${defaultWeight}`,
            outputNegativeRegex: `($1)${defaultWeight}`,
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "$1",
            recursiveCheck: false
        },
        {
            //This regex for leftover cases
            //so any resolved result ends with '::weight' will get fixed as below
            inputRegex: String.raw`(::[\d\.]+)`,
            outputRegex: "", //No idea currently, will be replace by empty string
            outputNegativeRegex: "",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "",
            recursiveCheck: false
        },
        {
            //This regex for leftover cases
            //so any resolved result ends with '):weight' will get fixed as below
            inputRegex: String.raw`(\):([\d\.]+))`,
            outputRegex: ")$2", //Current we remove ':', example: '(word):1.1' will become '(word)1.1'
            outputNegativeRegex: ")$2",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: ")$2",
            recursiveCheck: false
        },
        {
            //This regex for leftover cases
            //so any resolved result ends with '+:weight' will get fixed as below (very rare case)
            inputRegex: String.raw`(\+:([\d\.]+))`,
            outputRegex: "$2", //Currenly it will be replace with 'weight', example: '(word)+:1.1' will become '(word)1.1'
            outputNegativeRegex: "$2",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "$2",
            recursiveCheck: false
        },
        {
            //This regex for leftover cases
            //so any resolved result ends with '\)+' will get fixed as below (very rare case)
            inputRegex: String.raw`(\\\))\+`,
            outputRegex: "$1", //Currently we remove '+', example: '..word\)+' will become '...word\)'
            outputNegativeRegex: "$1",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "$1",
            recursiveCheck: false
        },
        {
            //This regex for leftover cases
            //so any resolved result ends with ')--:' will get fixed as below (very rare case)
            inputRegex: String.raw`(\)[\+\-]+)\:`,
            outputRegex: "$1", //Currently we remove ':', example: '..word)--:' will become '...word)--'
            outputNegativeRegex: "$1",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "$1",
            recursiveCheck: false
        },
        {
            //This regex for leftover cases
            //so any resolved result ends with ',:weight' will get fixed as below (very rare case)
            inputRegex: String.raw`\,\s{0,3}\:[\d\.]+`,
            outputRegex: "", //Currently we remove it all
            outputNegativeRegex: "",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "",
            recursiveCheck: false
        },
        {
            //This regex for leftover cases
            //Many uncalculated cases may cause ':' which will cause blend and break the output
            inputRegex: String.raw`\:`,
            outputRegex: ",", //It's safe to replace it with ',' for now
            outputNegativeRegex: ",",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: ",",
            recursiveCheck: false
        },
        {
            //This regex for leftover cases, currently 'AND' will be replace with ':' which will allow to blend
            inputRegex: String.raw`(\n)\s{0,5}(AND)\s{0,5}(\n)`,
            outputRegex: "$1:$3",
            outputNegativeRegex: "$1:$3",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "$1$2$3",
            recursiveCheck: false,
            v3: {
                //`:` no longer work in v3 and I don't know what is the other option for now
                outputRegex: "$1$2$3",
                outputNegativeRegex: "$1$2$3",
                //Negative raw will be used when user choose to ignore (attention and weight)
                outputNegativeRawRegex: "$1$2$3",
            }
        }
    ],
    //From invokeai to auto1111 key
    //this part should cover most basic cases, still need more tests
    auto1111RegexPatterns: [
        {
            //Invokeai negative prompt regex
            //we don't keep those in the output because negative part will be extracted alone before we start regex process
            inputRegex: String.raw`\[([^\]]+)\]`,
            outputRegex: "",
            outputNegativeRegex: "",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "",
            recursiveCheck: false
        },
        {
            //LoRa
            inputRegex: String.raw`withLora\((.*?),\s{0,3}([\d\.]+)\)`,
            outputRegex: "<lora:$1:$2>", //Expected match 'withLora($1,$2)
            outputNegativeRegex: "",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "",
            recursiveCheck: false
        },
        {
            //This regex will revert any '(word)defaultWeight' to '[word]'
            //this case already explained above
            inputRegex: String.raw`\(([^\)]+)\)${defaultWeight}`,
            outputRegex: `[$1]`,
            outputNegativeRegex: "[$1]",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "$1",
            recursiveCheck: false
        },
        {
            //Word with weight such as '(word)0.2'
            inputRegex: String.raw`\(([^\)]+)\)([\d\.]+)`,
            outputRegex: `$1:$2`, //Expected match '($1)$2'
            outputNegativeRegex: "$1:$2",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "$1",
            recursiveCheck: false
        },
        {
            //Regex to resolve back invokeai attention syntax
            //it will match results such as: '(word)+' or '(word)-', '(word)+++' or '(word)--'....
            inputRegex: [String.raw`\(([^)]+)\)@`, String.raw`\(([^)]+)\)!`],
            outputRegex: "!#$1#!",
            outputNegativeRegex: "!#$1#!",
            //Negative raw will be used when user choose to ignore (attention and weight)
            outputNegativeRawRegex: "$1",
            recursiveCheck: true,
            replacementsMap:
            {
                loopCount: 10,
                replacements: [
                    { target: "@", replacement: String.raw`\+`, output: false },
                    { target: "!", replacement: String.raw`\-`, output: false },
                    { target: "!#", replacement: `(`, output: true },
                    { target: "#!", replacement: `)`, output: true },
                ]
            },
        },
    ]
};


/********************/
/* SYNTAX RESOLVERS */
/********************/
//Recursive regex replacer
//'ignoreNegativeParameters' will force 'patternNegativeRawOutput' usage for negative prompts
function regexValueRecursiveReplace(input, regexPatternItem, ignoreNegativeParameters = false) {
    var inputPositive = input.positive;
    var inputNegative = input.negative;
    var replacementsMap = regexPatternItem.replacementsMap;
    var loopCount = replacementsMap.loopCount;
    var replacements = replacementsMap.replacements;
    var patternInput = regexPatternItem.inputRegex;
    var patternOutput = regexPatternItem.outputRegex;
    var patternNegativeOutput = regexPatternItem.outputNegativeRegex;
    var patternNegativeRawOutput = regexPatternItem.outputNegativeRawRegex;


    for (var i = loopCount; i >= 0; i--) {
        var iterations = i;
        patternInput = regexPatternItem.inputRegex;
        patternOutput = regexPatternItem.outputRegex;
        patternNegativeOutput = regexPatternItem.outputNegativeRegex;
        patternNegativeRawOutput = regexPatternItem.outputNegativeRawRegex;

        //Check if we have custom regex for current version
        var versionKey = "v" + invokeaiVersion;
        if (typeof regexPatternItem[versionKey] !== 'undefined') {
            if (typeof regexPatternItem[versionKey]["inputRegex"] !== 'undefined') {
                patternInput = regexPatternItem[versionKey]["inputRegex"];
            }
            if (typeof regexPatternItem[versionKey]["outputRegex"] !== 'undefined') {
                patternOutput = regexPatternItem[versionKey]["outputRegex"];
            }
            if (typeof regexPatternItem[versionKey]["outputNegativeRegex"] !== 'undefined') {
                patternNegativeOutput = regexPatternItem[versionKey]["outputNegativeRegex"];
            }
            if (typeof regexPatternItem[versionKey]["outputNegativeRawRegex"] !== 'undefined') {
                patternNegativeRawOutput = regexPatternItem[versionKey]["outputNegativeRawRegex"];
            }
            if (typeof regexPatternItem[versionKey]["replacementsMap"] !== 'undefined') {
                replacementsMap = regexPatternItem[versionKey]["replacementsMap"];
                loopCount = replacementsMap.loopCount;
                replacements = replacementsMap.replacements;
            }
        }

        //Expected to be one string regex value, 
        //it will be made as array with 1 element by default
        var inputRegexArray = [patternInput];
        //Check if it's array of regex values
        if (typeof (patternInput) === 'object') {
            //Assign it as-is
            inputRegexArray = patternInput;
        }

        //Loop through all regex items
        inputRegexArray.forEach(function (inputRegexItem) {

            /* PREPARE REGEX EXPRESSION */
            //This will prepare 'inputRegexItem' and 'patternOutput'
            //Loop through replacements lists
            replacements.forEach(function (replacementItem) {
                var mapTarget = replacementItem.target;
                var mapReplacement = replacementItem.replacement;
                var mapOutput = replacementItem.output;
                if (iterations > 0) {
                    for (var j = 0; j < iterations; j++) {
                        mapReplacement += replacementItem.replacement;
                    }
                }

                //if 'output:false' apply replacements on 'inputRegex'
                if (!mapOutput) {
                    inputRegexItem = inputRegexItem.replace(mapTarget, mapReplacement);
                } else {
                    //if 'output:true' apply replacements on 'outputRegex' and 'outputNegativeRegex'
                    patternOutput = patternOutput.replace(mapTarget, mapReplacement);
                    if (patternNegativeOutput.indexOf(mapTarget) !== -1) {
                        patternNegativeOutput = patternNegativeOutput.replace(mapTarget, mapReplacement);
                    }
                }
            });

            /* MATCH AND REPLACE */
            var matchPositive = null;
            var matchNegative = null;
            if (typeof inputRegexItem === 'function') {
                matchPositive = inputRegexItem();
                matchNegative = inputRegexItem(true);
            } else {
                matchPositive = inputRegexItem;
                matchNegative = inputRegexItem;
            }
            var regexExp = new RegExp(matchPositive, 'g');
            var regexNegativeExp = new RegExp(matchNegative, 'g');

            if (typeof patternOutput !== 'function' || patternOutput.toString().indexOf("regexGroups") === -1) {
                if (typeof patternOutput !== 'function') {
                    inputPositive = inputPositive.replace(regexExp, patternOutput);
                } else {
                    inputPositive = inputPositive.replace(regexExp, patternOutput());
                }
                if (!ignoreNegativeParameters) {
                    if (typeof patternNegativeOutput !== 'function') {
                        inputNegative = inputNegative.replace(regexNegativeExp, patternNegativeOutput);
                    } else {
                        if (patternNegativeOutput.toString().indexOf("regexGroups") === -1) {
                            inputNegative = inputNegative.replace(regexNegativeExp, patternNegativeOutput());
                        } else {
                            const regexNegativeGroups = inputNegative.matchAll(inputRegexItem);
                            inputNegative = patternNegativeOutput(inputNegative, regexNegativeGroups);
                        }
                    }
                }
            } else {
                //If 'patternOutput' is function then extract matched groups and pass them to the function
                const regexGroups = inputPositive.matchAll(matchPositive);
                inputPositive = patternOutput(inputPositive, regexGroups);

                const regexNegativeGroups = inputNegative.matchAll(matchNegative);
                if (!ignoreNegativeParameters) {
                    if (typeof patternNegativeOutput === 'function') {
                        if (patternNegativeOutput.toString().indexOf("regexGroups") === -1) {
                            inputNegative = inputNegative.replace(regexNegativeExp, patternNegativeOutput());
                        } else {
                            inputNegative = patternNegativeOutput(inputNegative, regexNegativeGroups);
                        }
                    } else {
                        inputNegative = patternOutput(inputNegative, regexNegativeGroups);
                    }
                }
            }

            if (ignoreNegativeParameters) {
                inputNegative = inputNegative.replace(regexExp, patternNegativeRawOutput);
            }
        });

    }
    var output = {
        positive: inputPositive,
        negative: inputNegative
    };
    return output;
}

function regexValueReplace(input, regexPatternItem, ignoreNegativeParameters = false) {
    var inputPositive = input.positive;
    var inputNegative = input.negative;
    var patternInput = regexPatternItem.inputRegex;
    var patternOutput = regexPatternItem.outputRegex;
    var patternNegativeOutput = regexPatternItem.outputNegativeRegex;
    var patternNegativeRawOutput = regexPatternItem.outputNegativeRawRegex;

    //Check if we have custom regex for current version
    var versionKey = "v" + invokeaiVersion;
    if (typeof regexPatternItem[versionKey] !== 'undefined') {
        if (typeof regexPatternItem[versionKey]["inputRegex"] !== 'undefined') {
            patternInput = regexPatternItem[versionKey]["inputRegex"];
        }
        if (typeof regexPatternItem[versionKey]["outputRegex"] !== 'undefined') {
            patternOutput = regexPatternItem[versionKey]["outputRegex"];
        }
        if (typeof regexPatternItem[versionKey]["outputNegativeRegex"] !== 'undefined') {
            patternNegativeOutput = regexPatternItem[versionKey]["outputNegativeRegex"];
        }
        if (typeof regexPatternItem[versionKey]["outputNegativeRawRegex"] !== 'undefined') {
            patternNegativeRawOutput = regexPatternItem[versionKey]["outputNegativeRawRegex"];
        }
    }

    //Expected to be one string regex value, 
    //it will be made as array with 1 element by default
    var inputRegexArray = [patternInput];
    //Check if it's array of regex values
    if (typeof (patternInput) === 'object') {
        //Assign it as-is
        inputRegexArray = patternInput;
    }

    //Loop through all regex items
    inputRegexArray.forEach(function (inputRegexItem) {
        var matchPositive = null;
        var matchNegative = null;
        if (typeof inputRegexItem === 'function') {
            matchPositive = inputRegexItem();
            matchNegative = inputRegexItem(true);
        } else {
            matchPositive = inputRegexItem;
            matchNegative = inputRegexItem;
        }
        var regexExp = new RegExp(matchPositive, 'g');
        var regexNegativeExp = new RegExp(matchNegative, 'g');

        if (typeof patternOutput !== 'function' || patternOutput.toString().indexOf("regexGroups") === -1) {
            if (typeof patternOutput !== 'function') {
                inputPositive = inputPositive.replace(regexExp, patternOutput);
            } else {
                inputPositive = inputPositive.replace(regexExp, patternOutput());
            }
            if (!ignoreNegativeParameters) {
                if (typeof patternNegativeOutput !== 'function') {
                    inputNegative = inputNegative.replace(regexNegativeExp, patternNegativeOutput);
                } else {
                    if (patternNegativeOutput.toString().indexOf("regexGroups") === -1) {
                        inputNegative = inputNegative.replace(regexNegativeExp, patternNegativeOutput());
                    } else {
                        const regexNegativeGroups = inputNegative.matchAll(inputRegexItem);
                        inputNegative = patternNegativeOutput(inputNegative, regexNegativeGroups);
                    }
                }
            }
        } else {
            //If 'patternOutput' is function then extract matched groups and pass them to the function
            const regexGroups = inputPositive.matchAll(matchPositive);
            inputPositive = patternOutput(inputPositive, regexGroups);
            if (!ignoreNegativeParameters) {
                const regexNegativeGroups = inputNegative.matchAll(matchNegative);
                if (typeof patternNegativeOutput === 'function') {
                    if (patternNegativeOutput.toString().indexOf("regexGroups") === -1) {
                        inputNegative = inputNegative.replace(regexNegativeExp, patternNegativeOutput());
                    } else {
                        inputNegative = patternNegativeOutput(inputNegative, regexNegativeGroups);
                    }
                } else {
                    inputNegative = patternOutput(inputNegative, regexNegativeGroups);
                }
            }
        }

        if (ignoreNegativeParameters) {
            inputNegative = inputNegative.replace(regexNegativeExp, patternNegativeRawOutput);
        }
    });


    var output = {
        positive: inputPositive,
        negative: inputNegative
    };

    return output;
}

//Fetch invokeai negative prompts, returns 'string' output
function fetchInvokeAINegatives(inputText) {
    var negativeRegex = String.raw`\[([^\]]+)\]`;
    const regexGroups = inputText.matchAll(negativeRegex);
    var negativeElements = [];
    for (const match of regexGroups) {
        var fullMatch = match[0];
        var innerMatch = match[1];
        negativeElements.push(innerMatch);
    }
    return negativeElements.join(", ");
}

//Output with tokens count
function prepareOutput(simpleInput, originalPositive, originalNegative, invokeAIOriginal = false) {
    var inputPositive = simpleInput.positive;
    var inputNegative = simpleInput.negative;
    var output = {
        from: {
            positive: {
                text: originalPositive,
                tokens: calculateTokens(originalPositive, invokeAIOriginal)
            },
            negative: {
                text: originalNegative,
                tokens: calculateTokens(originalNegative, invokeAIOriginal)
            },
        },
        to: {
            positive: {
                text: inputPositive,
                tokens: calculateTokens(inputPositive, !invokeAIOriginal)
            },
            negative: {
                text: inputNegative,
                tokens: calculateTokens(inputNegative, !invokeAIOriginal)
            },
        }
    };

    return output;
}

function setLimitedWeight(positive, negative) {
    if (positive !== null && [...positive.matchAll(/[\d\.]+/g)].length && positive > 0) {
        limitWeightPositive = positive;
    } else {
        limitWeightPositive = String.raw`$1`;
    }

    if (negative !== null && [...negative.matchAll(/[\d\.]+/g)].length && negative > 0) {
        limitWeightNegative = negative;
    } else {
        limitWeightNegative = String.raw`$1`;
    }
}

/******************/
/* TOKENS COUNTER */
/******************/
//Get cleaned results for accurate counting
function resolveTokensValues(inputValue, invokeAI = false) {
    var regexCleaner = regexConversionTable.invokeAIRegexPatterns
    if (invokeAI) {
        regexCleaner = regexConversionTable.auto1111RegexPatterns;
    }
    regexCleaner.forEach(regexPatternItem => {
        //We force negative raw cleanup style even for positive input
        var output = {
            positive: "",
            negative: inputValue
        };
        var patternRecursive = regexPatternItem.recursiveCheck;
        if (patternRecursive) {
            output = regexValueRecursiveReplace(output, regexPatternItem, true);
        } else {
            output = regexValueReplace(output, regexPatternItem, true);
        }
        inputValue = output.negative;
    });
    return inputValue;
}

function calculateTokens(inputValue, invokeAI = false) {
    var inputTokens = 0;
    //'encode' function available at 'encoders/cl100k_base.js', check 'index.html' header include
    if (inputValue.length > 0 && typeof encode !== 'undefined') {
        var cleanedInput = resolveTokensValues(inputValue, invokeAI);
        const inputElementEncoded = encode(cleanedInput);
        inputTokens = inputElementEncoded.length;
    }
    return inputTokens;
}

function calculateInvokeAITokens(inputPositive, inputNegative = "") {
    //It's expected to have negative values within input
    //so it's better to fetch them (if any)
    if (invokeaiVersion < 3) {
        //Version 2 only, 3 doesn't support that
        inputNegative += fetchInvokeAINegatives(inputPositive);
    }
    //Clean input positive from any 'negative' or new lines
    var cleanupRegex = [String.raw`\[([^\]]+)\]`, String.raw`\n`];
    cleanupRegex.forEach(element => {
        var regexExp = new RegExp(element, 'g');
        inputPositive = inputPositive.replace(regexExp, "");
    });

    //Final output
    var output = {
        positive: {
            text: inputPositive,
            tokens: calculateTokens(inputPositive, true)
        },
        negative: {
            text: inputNegative,
            tokens: calculateTokens(inputNegative, true)
        }
    };

    return output;
}