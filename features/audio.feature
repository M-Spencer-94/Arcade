Feature: Audio Effects
  As a Tetris player
  I want sound effects for key game events
  So that the game feels responsive

  Background:
    Given a fresh audio manager

  Scenario: Rotating a piece plays a rotate beep
    When the rotate sound is played
    Then a beep of 600Hz for 80ms should have been played

  Scenario: Locking a piece plays a lock beep
    When the lock sound is played
    Then a beep of 500Hz for 100ms should have been played

  Scenario: Clearing a line plays an ascending three-note sequence
    When the line clear sound is played
    Then beeps of 800Hz, 1000Hz and 1200Hz for 150ms each should have been played in order

  Scenario: Game over plays a descending three-note sequence
    When the game over sound is played
    Then beeps of 400Hz for 150ms, 300Hz for 150ms and 200Hz for 300ms should have been played in order

  Scenario: Muting silences future beeps
    Given the audio manager is muted
    When the rotate sound is played
    Then no beep should have been played

  Scenario: Unmuting restores beeps
    Given the audio manager is muted
    And the audio manager is unmuted
    When the rotate sound is played
    Then a beep of 600Hz for 80ms should have been played

  Scenario: A beep with no explicit frequency or duration uses the defaults
    When a beep is played with no frequency or duration specified
    Then a beep of 800Hz for 100ms should have been played

  Scenario: Falls back to webkitAudioContext when AudioContext is unavailable
    Given a browser environment with only webkitAudioContext available
    When a fresh audio manager is created
    Then it should use the webkitAudioContext
