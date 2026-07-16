Feature: Pac-Man Audio Effects
  As a Pac-Man player
  I want sound effects for key game events
  So that the game feels responsive

  Background:
    Given a fresh Pac-Man audio manager

  Scenario: Eating a dot plays a short chomp beep
    When the chomp sound is played
    Then a Pac-Man beep of 250Hz for 40ms should have been played

  Scenario: Eating a power pellet plays a low sustained beep
    When the power pellet sound is played
    Then a Pac-Man beep of 150Hz for 200ms should have been played

  Scenario: Eating a frightened ghost plays a high short beep
    When the ghost eaten sound is played
    Then a Pac-Man beep of 1200Hz for 120ms should have been played

  Scenario: Losing a life plays a four-step descending sequence
    When the death sound is played
    Then the death sound sequence should be 500Hz for 120ms, 400Hz for 120ms, 300Hz for 120ms and 200Hz for 240ms

  Scenario: Completing a level plays a three-step ascending sequence
    When the level complete sound is played
    Then the level-complete sound sequence should be 600Hz for 120ms, 800Hz for 120ms and 1000Hz for 200ms
