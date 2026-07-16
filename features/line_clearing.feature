Feature: Line Clearing
  As a Tetris player
  I want complete rows to be detected and removed
  So that I can clear lines and make room for more pieces

  Background:
    Given a new game has started

  Scenario: Single line is cleared
    Given the board is set up for a single line clear
    When the player hard drops
    Then 1 line should be cleared
    And the completed row should be removed
    And rows above should cascade down

  Scenario: Double line clear
    Given the board is set up for a double line clear
    When the player hard drops
    Then 2 lines should be cleared
    And both completed rows should be removed
    And rows above should cascade down

  Scenario: Triple line clear
    Given the board is set up for a triple line clear
    When the player hard drops
    Then 3 lines should be cleared
    And all completed rows should be removed
    And rows above should cascade down

  Scenario: Tetris (4-line clear)
    Given the board is set up for a 4-line clear
    When the player hard drops
    Then 4 lines should be cleared
    And all completed rows should be removed
    And rows above should cascade down

  Scenario: Incomplete row is not cleared
    Given the board has an incomplete row
    When the player hard drops
    Then no lines should be cleared
    And the incomplete row should remain incomplete

  Scenario: Non-adjacent lines clear separately
    Given the board has two non-adjacent complete rows
    When a new piece lands
    Then both rows should be cleared
    And the gap between them should be removed

  Scenario: Clearing from the top
    Given only the top row is complete
    When the row is cleared
    Then the top row should be removed
    And all rows below should cascade up

  Scenario: Clearing from the bottom
    Given only the bottom row is complete
    When the row is cleared
    Then the bottom row should be removed
    And a new empty row should appear at the top

  Scenario: Multiple clears in succession
    Given the board is nearly full with several complete rows
    When multiple pieces lock and complete several rows
    Then all complete rows should be cleared
    And score should accumulate for each clear
