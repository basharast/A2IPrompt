# About

This tool will help you to convert [Automatic1111](https://github.com/AUTOMATIC1111/stable-diffusion-webui) prompt to [InvokeAI](https://github.com/invoke-ai/InvokeAI) prompt

I'm sure it will make your life easier while applying prompts from online

<img src="docs/assets/preview.jpg?t=123">

## Results

You should get same result by 50-80%

at least you will not have totally different result

unless your InvokeAI version has 77 tokens limits ([solution here](https://github.com/invoke-ai/InvokeAI/pull/2896))


## Usage

Online test [click here](https://basharast.github.io/A2IPrompt/) and use it directly

or download this repo and open `index.html` it will work locally.

## Features 

- Support wide conversion cases

- Support translation from invokeai to automatic1111

- Copy shortcuts

- Tokens counter

- Prompt syntax highlights

- Auto prompt copy

- Weight limiters

- Much more translation improvements

- UI improvements


## Contribution

Feel free to submit any request or fix

if you want to make your own fork just don't remove copyright section.


## Tips

To avoid some bad results try one of the following:

- Change sampler

- Turn on Ignore Negative's (attention, weight)

- Limit any weight such as (1.3,1.4 or 2) to lower value.


## Privacy 

This tool works locally and doesn't send or collect any usage data or any texts

## Credits

Bashar Astifan (Developer)

GPT-Tokenizer thanks to [Bazyli Brzóska](https://github.com/niieani)

Syntax highlights and code editor [CodeMirror](https://codemirror.net/)

HTML page has some elements from [Navneet](https://codepen.io/heynavneet/details/yXjPLw) and [Trent Dec](https://codepen.io/Trentdec/pen/YBEQKm)
