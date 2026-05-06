/**
 * QuickDo — voice.js
 *
 * Implements real voice recognition using Web Speech API.
 * Uses webkitSpeechRecognition which is available in Chromium/Electron.
 */

'use strict';

const Voice = (() => {
  let recognition = null;
  let isListening = false;
  let finalTranscript = '';

  function _initRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this environment.');
      return false;
    }

    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isListening = true;
      _setTranscript('Listening…');
      document.getElementById('voice-indicator').classList.add('active');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const currentText = finalTranscript + interimTranscript;
      _setTranscript(currentText || 'Listening…');
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      _setTranscript('Error: ' + event.error);
      stop();
    };

    recognition.onend = () => {
      isListening = false;
      document.getElementById('voice-indicator').classList.remove('active');
      if (finalTranscript.trim()) {
        _onTranscriptComplete(finalTranscript.trim());
      } else {
        _setTranscript('Tap to speak');
      }
    };

    return true;
  }

  // ── Public API ─────────────────────────────────────────────

  function start() {
    if (isListening) return;
    if (!recognition && !_initRecognition()) {
      _setTranscript('Voice not supported.');
      return;
    }
    
    finalTranscript = '';
    _reset();
    
    try {
      recognition.start();
    } catch (e) {
      console.error(e);
    }
  }

  function stop() {
    if (recognition && isListening) {
      recognition.stop();
    }
    isListening = false;
  }

  // ── Private helpers ────────────────────────────────────────

  function _reset() {
    _setTranscript('Starting…');
    Modal.setPending(null);
    document.getElementById('parsed-preview').classList.remove('visible');
    document.getElementById('date-prompt').classList.remove('visible');
  }

  function _setTranscript(text) {
    const el = document.getElementById('voice-transcript');
    if (el) el.textContent = text;
  }

  function _onTranscriptComplete(phrase) {
    // Run the phrase through the date parser
    const parsed = DateParser.parse(phrase);
    if (parsed) {
      const clean = parsed.clean || phrase;
      Modal.setPending({ text: clean, date: parsed.date, dateLabel: parsed.label });
      document.getElementById('parsed-task-text').textContent = clean;
      document.getElementById('parsed-date-text').textContent = parsed.label;
      document.getElementById('parsed-preview').classList.add('visible');
      document.getElementById('date-prompt').classList.remove('visible');
    } else {
      const clean = DateParser.stripFiller(phrase);
      Modal.setPending({ text: clean, date: null, dateLabel: null });
      document.getElementById('parsed-preview').classList.remove('visible');
      document.getElementById('date-prompt').classList.add('visible');
    }
  }

  // ── Event binding ──────────────────────────────────────────

  function init() {
    const indicator = document.getElementById('voice-indicator');
    if (indicator) {
      indicator.addEventListener('click', () => {
        if (!isListening) start();
        else stop();
      });
    }
  }

  return { init, start, stop };
})();
