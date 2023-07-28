# About

This tool will help you to convert [Automatic1111](https://github.com/AUTOMATIC1111/stable-diffusion-webui) prompt to [InvokeAI](https://github.com/invoke-ai/InvokeAI) prompt

I'm sure it will make your life easier while applying prompts from online

<img src="docs/assets/preview.jpg?t=123">

<img src="docs/assets/preview2.JPG?t=123">

## Results

You should get same result by 50-80%

at least you will not have totally different result

unless your InvokeAI version has 77 tokens limits ([solution here](https://github.com/invoke-ai/InvokeAI/pull/2896))


## Usage

Online test [click here](https://basharast.github.io/A2IPrompt/) and use it directly

or download this repo and open `index.html` it will work locally.

## Features 

- Support InvokeAI (V2 and V3)

- Support wide conversion cases

- Support translation from invokeai to automatic1111

- Fetch prompt from online image

- Copy shortcuts

- Tokens counter

- Prompt syntax highlights

- Auto prompt copy

- Weight limiters

- Weight randomizer


## Contribution

Feel free to submit any request or fix

if you want to make your own fork just don't remove copyright section.


## Tips

To avoid some bad results try one of the following:

- Change sampler

- Turn on Ignore Negative's (attention, weight)

- Limit any weight such as (1.3,1.4 or 2) to lower value.

- Be sure you're not missing negative texture inversion


## Privacy 

This tool works locally and doesn't send or collect any usage data or any texts

## Standalone (Developers)

If you want to use the translation engine in your project use `converter_standalone.js`

```js
//Create instance first
var invokeaiResolver = new InvokeAIPromptResolver();

//Prepare options, all keys are optional, you don't have to add all of them
var resolverOptions = {
    invokeaiVersion: 2,
    rawNegative: false,
    limitWeightPositive: "$1",
    limitWeightNegative: "$1",
    randomWeight: false,
    usePowValueAlways: false
};

//1- From auto1111 to invokeai 
var output1 = invokeaiResolver.convertAuto1111ToInvokeAI(positive, negative, options);

//2- From invokeai to auto1111
var output2 = invokeaiResolver.convertInvokeAIToAuto1111(positive, negative, options);;

//Both functions (1 & 2) returns object as below:
/*
    {
    from: {
        positive: { text: , tokens: },
            negative: { text: , tokens: },
        },
        to: {
            positive: { text: , tokens: },
            negative: { text: , tokens: },
        }
    }
*/

//Calculate token without translation
//Require `encoders/cl100k_base.js` to be included
var tokensOutput = invokeaiResolver.calculateInvokeAITokens(positive, negative);
//This function returns object as below:
/*
    {
        positive: {
            text: inputPositive,
            tokens: this.calculateTokens(inputPositive, true)
        },
        negative: {
            text: inputNegative,
            tokens: this.calculateTokens(inputNegative, true)
        }
    };
*/

```

## Credits

Bashar Astifan (Developer)

GPT-Tokenizer thanks to [Bazyli Brzóska](https://github.com/niieani)

Syntax highlights and code editor [CodeMirror](https://codemirror.net/)

Tooltips [TippyJS](https://atomiks.github.io/tippyjs/)

Notifications [Ryan Morr](https://codepen.io/ryanmorr/pen/MyVvLg)

Checkbox switch [Edgar](https://codepen.io/BuiltByEdgar/pen/jWOVYQ)

HTML page has some elements from [Navneet](https://codepen.io/heynavneet/details/yXjPLw) and [Trent Dec](https://codepen.io/Trentdec/pen/YBEQKm)
