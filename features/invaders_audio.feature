Feature: Space Invaders Audio Effects
  As a Space Invaders player
  I want sound effects for shooting, hits, and wave transitions
  So that the game feels responsive

  Background:
    Given a fresh Space Invaders audio manager

  Scenario: Firing a shot plays a sharp beep
    When the invaders shoot sound is played
    Then a Space Invaders beep of 900Hz for 60ms should have been played

  Scenario: Hitting an invader plays a low beep
    When the invaders invader-hit sound is played
    Then a Space Invaders beep of 220Hz for 80ms should have been played

  Scenario: Losing a life plays a descending three-step sequence
    When the invaders player-hit sound is played
    Then the invaders player-hit sound sequence should be 400Hz for 150ms, 300Hz for 150ms and 200Hz for 300ms

  Scenario: Clearing a wave plays an ascending three-step sequence
    When the invaders wave-clear sound is played
    Then the invaders wave-clear sound sequence should be 500Hz for 100ms, 700Hz for 100ms and 900Hz for 150ms
