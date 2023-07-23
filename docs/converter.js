/**
 * Developer: Bashar Astifan 2023
 * Link: https://github.com/basharast
 */

var appVersion = "1.5.0";

var reverseConversion = false;
var allowReverseConversion = false;
var ignoreNegativeParameters = false;
var autoCopyInvokeAI = false;
var limitWeight = false;
var randomizeWeight = false;
var defaultLimitWeightPositive = "1.1";
var defaultLimitWeightNegative = "1.1";
var invokeaiVersion = 2;

var normalConversionInProgress = false;
var reverseConversionInProgress = false;

var auto1111PositiveCodeMirror = null;
var auto1111NegativeCodeMirror = null;
var invokeaiPositiveCodeMirror = null;
var invokeaiNegativeCodeMirror = null;

function resolvePromptSyntax() {
    var inputPositive = "";
    var inputNegative = "";

    var finalOutput = null;
    if (!reverseConversion) {
        inputPositive = auto1111PositiveCodeMirror.getValue();
        inputNegative = auto1111NegativeCodeMirror.getValue();
        finalOutput = convertAuto1111ToInvokeAI(inputPositive, inputNegative, ignoreNegativeParameters, invokeaiVersion);
    } else {
        inputPositive = invokeaiPositiveCodeMirror.getValue();
        inputNegative = invokeaiNegativeCodeMirror.getValue();
        finalOutput = convertInvokeAIToAuto1111(inputPositive, inputNegative, ignoreNegativeParameters, invokeaiVersion);
    }

    var invokeai = finalOutput.to;
    var auto1111 = finalOutput.from;
    if (reverseConversion) {
        invokeai = finalOutput.from;
        auto1111 = finalOutput.to;
    }

    if (!reverseConversion) {
        invokeaiPositiveCodeMirror.getDoc().setValue(invokeai.positive.text.trim());
        invokeaiNegativeCodeMirror.getDoc().setValue(invokeai.negative.text.trim());
        setTimeout(function () {
            normalConversionInProgress = false;
        }, 100);
    } else {
        auto1111PositiveCodeMirror.getDoc().setValue(auto1111.positive.text.trim());
        auto1111NegativeCodeMirror.getDoc().setValue(auto1111.negative.text.trim());
        setTimeout(function () {
            reverseConversionInProgress = false;
        }, 100);
    }
    calculateTokensCount(invokeai, auto1111);
    if (autoCopyInvokeAI) {
        $("#copy-invokeai-prompt").click();
    }
}

function calculateTokensCount(invokeai, auto1111) {
    //Update tokens counters
    $('#invokeai-tokens-positive').html(invokeai.positive.tokens);
    $('#invokeai-tokens-negative').html(invokeai.negative.tokens);
    $('#auto1111-tokens-positive').html(auto1111.positive.tokens);
    $('#auto1111-tokens-negative').html(auto1111.negative.tokens);
}

//Page ready
//Warning: before you scroll down, if you are looking for dynamic & organized code this is the wrong place, below everything made manually (planned to be better.. one day)
$(document).ready(function () {

    //CodeMirror default config
    var mirrorConfigs = {
        matchBrackets: true,
        lineWrapping: true,
        placeholder: "",
        mode: "prompt",
        theme: "night",
        stylesheet: "assets/prompt.css",
        parserfile: "assets/prompt.js",
        scrollbarStyle: "simple"
    };

    //CodeMirror InvokeAI Positive
    var invokeaiPositiveElement = $('#invokeai-positive');
    var invokePositiveConfigs = mirrorConfigs;
    invokePositiveConfigs.placeholder = invokeaiPositiveElement.attr("placeholder");
    invokePositiveConfigs.mode = "prompt-positive";
    invokeaiPositiveCodeMirror = CodeMirror.fromTextArea(invokeaiPositiveElement.get(0), invokePositiveConfigs);
    invokeaiPositiveCodeMirror.on("change", function (cm, change) {
        if (!normalConversionInProgress) {
            if (allowReverseConversion) {
                reverseConversion = true;
                reverseConversionInProgress = true;
                resolvePromptSyntax();
            } else {
                //Just calculate tokens
                var invokeAIInput = cm.getValue();
                var tokensOutput = calculateInvokeAITokens(invokeAIInput);
                $('#invokeai-tokens-positive').html(tokensOutput.positive.tokens);
            }
        }
    });

    //CodeMirror InvokeAI Negative
    var invokeaiNegativeElement = $('#invokeai-negative');
    var invokeNegativeConfigs = mirrorConfigs;
    invokeNegativeConfigs.placeholder = invokeaiNegativeElement.attr("placeholder");
    invokeNegativeConfigs.mode = "prompt-negative";
    invokeaiNegativeCodeMirror = CodeMirror.fromTextArea(invokeaiNegativeElement.get(0), invokeNegativeConfigs);
    invokeaiNegativeCodeMirror.on("change", function (cm, change) {
        if (!normalConversionInProgress) {
            if (allowReverseConversion) {
                reverseConversion = true;
                reverseConversionInProgress = true;
                resolvePromptSyntax();
            } else {
                //Just calculate tokens
                var invokeAIInput = cm.getValue();
                var tokensOutput = calculateInvokeAITokens("", invokeAIInput);
                $('#invokeai-tokens-negative').html(tokensOutput.negative.tokens);
            }
        }
    });


    //CodeMirror Auto1111 Positive
    var auto111PositiveElement = $('#auto1111-positive');
    var auto111PositiveConfigs = mirrorConfigs;
    auto111PositiveConfigs.placeholder = auto111PositiveElement.attr("placeholder");
    auto111PositiveConfigs.mode = "prompt-positive";
    auto1111PositiveCodeMirror = CodeMirror.fromTextArea(auto111PositiveElement.get(0), auto111PositiveConfigs);
    auto1111PositiveCodeMirror.on("change", function (cm, change) {
        if (!reverseConversionInProgress) {
            reverseConversion = false;
            normalConversionInProgress = true;
            resolvePromptSyntax();
        }
    });

    //CodeMirror Auto1111 Positive
    var auto111NegativeElement = $('#auto1111-negative');
    var auto111NegativeConfigs = mirrorConfigs;
    auto111NegativeConfigs.placeholder = auto111NegativeElement.attr("placeholder");
    auto111NegativeConfigs.mode = "prompt-negative";
    auto1111NegativeCodeMirror = CodeMirror.fromTextArea(auto111NegativeElement.get(0), auto111NegativeConfigs);
    auto1111NegativeCodeMirror.on("change", function (cm, change) {
        if (!reverseConversionInProgress) {
            reverseConversion = false;
            normalConversionInProgress = true;
            resolvePromptSyntax();
        }
    });


    //Set default options
    $('#reverse-check').prop('checked', allowReverseConversion);
    $('#raw-negative-check').prop('checked', ignoreNegativeParameters);
    $('#limit-weight-check').prop('checked', limitWeight);
    $('#random-weight-check').prop('checked', randomizeWeight);
    $('#auto-copy-check').prop('checked', autoCopyInvokeAI);
    $('#limit-weight-positive-value').val(defaultLimitWeightPositive);
    $('#limit-weight-negative-value').val(defaultLimitWeightNegative);
    $("#remote-image-link").val("");

    //Set current version
    invokeaiVersion = $("#invokeai-release").val();

    //Attach checkboxes events
    $(".limit-weight").on("input", function () {
        defaultLimitWeightPositive = $('#limit-weight-positive-value').val();
        defaultLimitWeightNegative = $('#limit-weight-negative-value').val();
        setLimitedWeight(defaultLimitWeightPositive, defaultLimitWeightNegative, randomizeWeight);
        resolvePromptSyntax();
    });

    if (limitWeight) {
        $('.limit-weight').prop('disabled', false);
        $('#random-weight-label').attr('data-tippy-content', "Randomize prompt weights");
        $('#random-weight-container').removeClass("disabled");
        setLimitedWeight(defaultLimitWeightPositive, defaultLimitWeightNegative, randomizeWeight);
        if (ignoreNegativeParameters) {
            $('#limit-weight-negative-value').prop('disabled', true);
        } else {
            $('#limit-weight-negative-value').prop('disabled', false);
        }
    } else {
        $('.limit-weight').prop('disabled', true);
        $('#random-weight-check').prop('disabled', true);
        $('#random-weight-label').attr('data-tippy-content', "Randomize prompt weights (Enable limiter)");
        $('#random-weight-container').addClass("disabled");
    }

    $('#reverse-check').change(function () {
        allowReverseConversion = this.checked;
    });

    $('#auto-copy-check').change(function () {
        autoCopyInvokeAI = this.checked;
    });

    $('#raw-negative-check').change(function () {
        ignoreNegativeParameters = this.checked;
        if (ignoreNegativeParameters) {
            $('#limit-weight-negative-value').prop('disabled', true);
        } else {
            $('#limit-weight-negative-value').prop('disabled', !$('#limit-weight-check').is(':checked'));
        }
        reverseConversion = $('#reverse-check').is(':checked');
        resolvePromptSyntax();
    });

    $('#limit-weight-check').change(function () {
        limitWeight = this.checked;
        if (limitWeight) {
            $('.limit-weight').prop('disabled', false);
            $('#random-weight-check').prop('disabled', false);
            $('#random-weight-label').attr('data-tippy-content', "Randomize prompt weights");
            $('#random-weight-container').removeClass("disabled");
            setLimitedWeight(defaultLimitWeightPositive, defaultLimitWeightNegative, randomizeWeight);
            if (ignoreNegativeParameters) {
                $('#limit-weight-negative-value').prop('disabled', true);
            } else {
                $('#limit-weight-negative-value').prop('disabled', false);
            }
        } else {
            $('.limit-weight').prop('disabled', true);
            $('#random-weight-check').prop('disabled', true);
            $('#random-weight-label').attr('data-tippy-content', "Randomize prompt weights (Enable limiter)");
            $('#random-weight-container').addClass("disabled");
            setLimitedWeight("$1", "$1", randomizeWeight);
        }
        reverseConversion = $('#reverse-check').is(':checked');
        resolvePromptSyntax();
    });

    $('#random-weight-check').change(function () {
        randomizeWeight = this.checked;
        setLimitedWeight(defaultLimitWeightPositive, defaultLimitWeightNegative, randomizeWeight);
        reverseConversion = $('#reverse-check').is(':checked');
        resolvePromptSyntax();
    });

    $("#random-weight-reload").click(function () {
        if (randomizeWeight) {
            setLimitedWeight(defaultLimitWeightPositive, defaultLimitWeightNegative, randomizeWeight);
            reverseConversion = $('#reverse-check').is(':checked');
            resolvePromptSyntax();
        }
    });

    //Attach invokeai version event
    $('#invokeai-release').on('change', function (e) {
        var optionSelected = $("option:selected", this);
        var valueSelected = this.value;
        invokeaiVersion = valueSelected;
        reverseConversion = $('#reverse-check').is(':checked');
        showNotification('success', 'Success!', "Switched to InvokeAI v" + invokeaiVersion);
        resolvePromptSyntax();
    });

    //Attach copy events
    $('#copy-auto1111-positive, .input-label[target=auto1111-positive]').click(function () {
        var thisElement = $("#copy-auto1111-positive");
        var inputValue = auto1111PositiveCodeMirror.getValue();
        navigator.clipboard.writeText(inputValue);
        $('.copy-text', thisElement).fadeIn("fast").css("display", "inline");
        setTimeout(function () {
            $('.copy-text', thisElement).fadeOut();
        }, 2500);
    });

    $('#copy-auto1111-negative, .input-label[target=auto1111-negative]').click(function () {
        var thisElement = $("#copy-auto1111-negative");
        var inputValue = auto1111NegativeCodeMirror.getValue();
        navigator.clipboard.writeText(inputValue);
        $('.copy-text', thisElement).fadeIn("fast").css("display", "inline");
        setTimeout(function () {
            $('.copy-text', thisElement).fadeOut();
        }, 2500);
    });

    var totalClipboardCalls = 0;
    $('#copy-invokeai-prompt, .input-label-invoke[target=invokeai-positive]').click(function () {
        var thisElement = $("#copy-invokeai-prompt");
        var invokeAIOutput = invokeaiPositiveCodeMirror.getValue();
        try {
            totalClipboardCalls++;
            setTimeout(function () {
                if (totalClipboardCalls == 1) {
                    navigator.clipboard.writeText(invokeAIOutput);
                    $('.copy-text-invokeai', thisElement).fadeIn("fast").css("display", "inline");
                    setTimeout(function () {
                        $('.copy-text-invokeai', thisElement).fadeOut();
                    }, 2500);
                }
                totalClipboardCalls--;
            }, autoCopyInvokeAI ? 1000 : 1);

        } catch (e) {
            console.warn(e);
        }
    });

    $('#copy-invokeai-negative, .input-label-invoke[target=invokeai-negative]').click(function () {
        var thisElement = $("#copy-invokeai-negative");
        var inputNegative = invokeaiNegativeCodeMirror.getValue();
        navigator.clipboard.writeText(inputNegative);
        $('.copy-text', thisElement).fadeIn("fast").css("display", "inline");
        setTimeout(function () {
            $('.copy-text', thisElement).fadeOut();
        }, 2500);
    });

    //Call resolve after page load
    setTimeout(resolvePromptSyntax(), 500);

    //Attach tooltips
    tippy('[data-tippy-content]', {
        allowHTML: true,
        onShow(instance) {
            let cont = instance.reference.dataset.tippyContent;
            instance.setContent(cont);
        },
    });

    //Scroll event
    $(window).bind('scroll', function () {
        if ($(window).scrollTop() + $(window).height() == $(document).height()) {
            //Prevent copyright section from blocking options on small screens
            if (!$("#page-footer").is(":hidden")) {
                $("#page-footer").fadeOut("fast");
            }
        } else {
            if ($("#page-footer").is(":hidden")) {
                $("#page-footer").fadeIn("fast");
            }
        }
    });

    //Remote image event
    $("#remote-image-link").on("input", function () {
        RemoteImageCall();
    });
    $("#online-image-reload").click(function () {
        RemoteImageCall();
    });
    $('[target=image-info]').click(function () {
        var copyData = $(this).attr("copy-data");
        var dataType = $(this).attr("copy-type");
        try {
            navigator.clipboard.writeText(copyData);
            if (dataType == "Preview") {
                showNotification('success', dataType, "Image link sent to clipboard");
            } else {
                showNotification('success', dataType, copyData + "<br>Sent to clipboard");
            }
        } catch (ex) {
            showNotification('error', dataType, "Failed to copy<br>Check console log");
        }
    });

    //Page codeMirror style resolver
    $("body").on('DOMSubtreeModified', ".CodeMirror-code", function () {
        $("span[class^='cm-dummy-color']").each(function (index, value) {
            var elementClass = $(this).attr('class');
            var elementStyle = elementClass.replace("cm-dummy-", "");
            elementStyle = elementStyle.replace(/cm\-/g, "");
            $(this).attr("style", elementStyle);
        });
    });

    //Assign app version
    $("#app-version").html("v" + appVersion);
});

function RemoteImageCall() {
    var onlineImageElement = $("#remote-image-link");
    var onlineImageContainer = $("#online-image-container");
    var onlineImageInfo = $("#online-image-info");
    var link = onlineImageElement.val();
    onlineImageElement.removeClass("correct");
    onlineImageElement.removeClass("wrong");
    onlineImageContainer.attr("data-tippy-content", "Get prompt from online image");
    onlineImageInfo.hide();
    if (link.length > 0) {
        FetchRemoteImagePrompt(link);
    }
}
function FetchRemoteImagePrompt(imageLink) {
    var onlineImageElement = $("#remote-image-link");
    var onlineImageContainer = $("#online-image-container");
    var onlineImageInfo = $("#online-image-info");
    if (typeof imageLink !== 'undefined' && imageLink.indexOf("http") !== -1 && imageLink.indexOf("images/") !== -1) {
        var loaderElement = $("#online-image-loader");

        loaderElement.fadeIn("fast").css("display", "inline-block");
        onlineImageElement.prop('disabled', true);
        var regex = /(.*)(images\/)(\d+).*/;
        var imageID = imageLink.replace(regex, "$3");
        var siteLink = imageLink.replace(regex, "$1");
        var expectedAPI = siteLink + "api/v1/images?imageId=" + imageID;
        auto1111PositiveCodeMirror.getDoc().setValue("");
        auto1111NegativeCodeMirror.getDoc().setValue("");
        setTimeout(async function () {
            try {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", expectedAPI, false);
                xhr.setRequestHeader("Content-type", "application/json");
                xhr.onload = function (e) {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            var responseFullData = xhr.responseText;
                            var jsonResult = responseFullData;
                            try {
                                jsonResult = JSON.parse(responseFullData);
                            } catch (exj) {

                            }
                            if (jsonResult != null && typeof jsonResult["items"] !== 'undefined' && typeof jsonResult["items"][0] !== 'undefined' && jsonResult["items"][0] !== null) {
                                var targetImage = jsonResult["items"][0];
                                if (typeof targetImage["meta"] !== 'undefined' && targetImage["meta"] !== null) {
                                    var imageMeta = targetImage["meta"];
                                    var fetchedPositive = typeof imageMeta["prompt"] !== 'undefined' ? imageMeta["prompt"] : "";
                                    var fetchedNegative = typeof imageMeta["negativePrompt"] !== 'undefined' ? imageMeta["negativePrompt"] : "";
                                    var fetchedPreview = typeof targetImage["url"] !== 'undefined' && targetImage["url"] !== null ? targetImage["url"] : "";

                                    if ((fetchedPositive != null && fetchedPositive.length) > 0 || (fetchedNegative != null && fetchedNegative.length) > 0) {
                                        if (fetchedPositive != null && fetchedPositive.length > 0) {
                                            auto1111PositiveCodeMirror.getDoc().setValue(fetchedPositive);
                                        }
                                        if (fetchedNegative != null && fetchedNegative.length > 0) {
                                            auto1111NegativeCodeMirror.getDoc().setValue(fetchedNegative);
                                        }
                                        onlineImageElement.addClass("correct");
                                        onlineImageContainer.attr("data-tippy-content", "Prompt found and fetched");
                                        showNotification('success', 'Success!', "Prompt found and fetched");

                                        //Fetch image info
                                        var fetchedSeed = typeof imageMeta["seed"] !== 'undefined' && imageMeta["seed"] !== null ? imageMeta["seed"].toString() : "";
                                        var fetchedSampler = typeof imageMeta["sampler"] !== 'undefined' && imageMeta["sampler"] !== null ? imageMeta["sampler"] : "";
                                        var fetchedSteps = typeof imageMeta["steps"] !== 'undefined' && imageMeta["steps"] !== null ? imageMeta["steps"].toString() : "";
                                        var fetchedcfgScale = typeof imageMeta["cfgScale"] !== 'undefined' && imageMeta["cfgScale"] !== null ? imageMeta["cfgScale"].toString() : "";
                                        var fetchedSize = typeof imageMeta["Size"] !== 'undefined' && imageMeta["Size"] !== null ? imageMeta["Size"] : "";
                                        var fetchedModel = typeof imageMeta["Model"] !== 'undefined' && imageMeta["Model"] !== null ? imageMeta["Model"] : "";
                                        var infoList = [
                                            {
                                                type: "Seed",
                                                data: fetchedSeed
                                            },
                                            {
                                                type: "Sampler",
                                                data: fetchedSampler
                                            },
                                            {
                                                type: "Steps",
                                                data: fetchedSteps
                                            },
                                            {
                                                type: "CFGScale",
                                                data: fetchedcfgScale
                                            },
                                            {
                                                type: "Size",
                                                data: fetchedSize
                                            },
                                            {
                                                type: "Model",
                                                data: fetchedModel
                                            },
                                            {
                                                type: "Preview",
                                                data: fetchedPreview
                                            },
                                        ];
                                        infoList.forEach(function (imageInfoItem) {
                                            var dataType = imageInfoItem.type;
                                            var dataCopy = imageInfoItem.data;
                                            if (dataCopy.length > 0) {
                                                $('[copy-type=' + dataType + ']').attr("copy-data", dataCopy);
                                                if (dataType == "Preview") {
                                                    $('[copy-type=' + dataType + ']').attr("data-tippy-content", "Click to copy");
                                                    $(".online-image-preview").attr("src", dataCopy);
                                                } else {
                                                    $('[copy-type=' + dataType + ']').attr("data-tippy-content", dataCopy);
                                                }
                                                $('[copy-type=' + dataType + ']').show();
                                            } else {
                                                $('[copy-type=' + dataType + ']').hide();
                                            }
                                        });

                                        onlineImageInfo.show();
                                    } else {
                                        onlineImageElement.addClass("wrong");
                                        onlineImageContainer.attr("data-tippy-content", "Image doesn't have prompts");
                                        showNotification('warning', 'Issue!', "Image doesn't have prompts");
                                        onlineImageInfo.hide();
                                    }
                                } else {
                                    onlineImageElement.addClass("wrong");
                                    onlineImageContainer.attr("data-tippy-content", "Images doesn't have meta data");
                                    showNotification('warning', 'Issue!', "Images doesn't have meta data");
                                    onlineImageInfo.hide();
                                }
                            } else {
                                onlineImageElement.addClass("wrong");
                                onlineImageContainer.attr("data-tippy-content", "Response doesn't contain valid data");
                                showNotification('error', 'Error!', "Response doesn't contain valid data<br>New images may always fail");
                                onlineImageInfo.hide();
                            }
                        } else {
                            onlineImageElement.addClass("wrong");
                            onlineImageContainer.attr("data-tippy-content", "Request failed, check console log");
                            showNotification('error', 'Error!', "Request failed, check console log<br>New images may always fail");
                            onlineImageInfo.hide();
                        }
                    }
                };
                xhr.onerror = function (e) {
                    onlineImageElement.addClass("wrong");
                    onlineImageContainer.attr("data-tippy-content", (typeof e.message === 'undefined' ? "Please try again" : e.message));
                    showNotification('error', 'Error!', (typeof e.message === 'undefined' ? "Please try again" : e.message) + "<br>Check console log");
                    onlineImageInfo.hide();
                };

                xhr.onabort = function (e) {
                    onlineImageElement.addClass("wrong");
                    onlineImageContainer.attr("data-tippy-content", (typeof e.message === 'undefined' ? "Please try again" : e.message));
                    showNotification('error', 'Aborted!', (typeof e.message === 'undefined' ? "Please try again" : e.message) + "<br>Check console log");
                    onlineImageInfo.hide();
                };

                xhr.ontimeout = function (e) {
                    onlineImageElement.addClass("wrong");
                    onlineImageContainer.attr("data-tippy-content", (typeof e.message === 'undefined' ? "Please try again" : e.message));
                    showNotification('error', 'Timeout!', (typeof e.message === 'undefined' ? "Please try again" : e.message) + "<br>Check console log");
                    onlineImageInfo.hide();
                };

                xhr.send();

                onlineImageElement.prop('disabled', false);
                loaderElement.fadeOut("fast");
            } catch (ex) {
                console.warn(ex);
                showNotification('error', 'Error!', "Something went wrong, check console log");
                onlineImageInfo.hide();
                onlineImageElement.prop('disabled', false);
                loaderElement.fadeOut("fast");
            }
        }, 500);
    } else {
        onlineImageElement.addClass("wrong");
        onlineImageContainer.attr("data-tippy-content", "This link is not valid or not supported");
        onlineImageInfo.hide();
    }
}