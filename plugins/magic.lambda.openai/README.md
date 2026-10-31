---
title: magic.lambda.openai
---

This project provides OpenAI related slots for Magic. More specifically, it provides the following slots.

* __[openai.tokenize]__ - Returns how many tokens the specified text will consume from OpenAI
* __[openai.whisper]__ - Transcribes audio content using OpenAI Whisper

The above slot will calculate how many tokens the specified input requires from the OpenAI endpoints.

```
openai.tokenize:This is some query
```

## How to use [openai.whisper]

This slot transcribes audio by sending it to OpenAI's audio transcription endpoint, using the `whisper-1` model,
and returns the transcribed text as its value. It takes the following arguments as children, and throws an
exception if any of the three mandatory ones is missing, or if OpenAI responds with an error.

* __[key]__ - OpenAI API key. Mandatory.
* __[content]__ - The audio as raw bytes. Mandatory.
* __[type]__ - MIME type of the audio, such as `audio/mpeg`. Mandatory.
* __[language]__ - Optional language hint.

This slot transcribes audio to text using OpenAI Whisper, and sets its value to the transcription. It needs your OpenAI **[key]**, the audio as **[content]**, and its MIME **[type]**, and takes an optional **[language]** hint. Below is an example.

```
.key:YOUR_OPENAI_API_KEY
io.file.load.binary:/misc/speech.mp3
openai.whisper
   key:x:@.key
   content:x:@io.file.load.binary
   type:audio/mpeg
```


## Credits

Thx to Devis Lucato for publishing the original work under CC0 [here](https://github.com/dluc/openai-tools).
