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
  let _hadError = false;

  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

  function _initRecognition() {
    if (!SpeechRecognitionCtor) {
      console.warn('Speech recognition not supported in this environment.');
      return false;
    }

    recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isListening = true;
      _hadError = false;
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
      _hadError = true;
      isListening = false;
      if (event.error === 'not-allowed') {
        _setTranscript('Microphone access denied. Check browser permissions.');
      } else if (event.error === 'no-speech') {
        _setTranscript('No speech detected. Tap to try again.');
      } else {
        _setTranscript('Error: ' + event.error + '. Tap to retry.');
      }
    };

    recognition.onend = () => {
      isListening = false;
      document.getElementById('voice-indicator').classList.remove('active');
      if (finalTranscript.trim()) {
        _onTranscriptComplete(finalTranscript.trim());
      } else if (!_hadError) {
        _setTranscript('Tap to speak');
      }
    };

    return true;
  }

  // ── Public API ─────────────────────────────────────────────

  function start() {
    if (isListening) return;
    // Always reinitialise to avoid InvalidStateError after a previous session
    recognition = null;
    _hadError = false;
    if (!_initRecognition()) {
      _setTranscript('Voice not supported in this browser.');
      return;
    }
    
    finalTranscript = '';
    _reset();
    
    try {
      recognition.start();
    } catch (e) {
      console.error('recognition.start() threw:', e);
      _setTranscript('Could not start microphone. Tap to retry.');
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
