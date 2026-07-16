Feature: Space Invaders Collision Detection
  As a Space Invaders player
  I want bullets to hit exactly what they touch, not what they merely pass near
  So that combat feels fair and precise

  Background:
    Given a new Space Invaders game has started

  # --- rectsOverlap, exercised directly to isolate every branch of its AABB check ---

  Scenario: Rectangles separated on the x-axis do not overlap
    Given rectangle A at x 0 y 0 width 10 height 10
    And rectangle B at x -30 y 0 width 10 height 10
    Then the rectangles should not overlap

  Scenario: Rectangles touching edge-to-edge on the x-axis do not overlap
    Given rectangle A at x 0 y 0 width 10 height 10
    And rectangle B at x 10 y 0 width 10 height 10
    Then the rectangles should not overlap

  Scenario: Rectangles overlapping by a single unit on the x-axis do overlap
    Given rectangle A at x 0 y 0 width 10 height 10
    And rectangle B at x 9 y 0 width 10 height 10
    Then the rectangles should overlap

  Scenario: Rectangle A entirely below rectangle B does not overlap
    Given rectangle A at x 0 y 100 width 10 height 10
    And rectangle B at x 0 y 0 width 10 height 10
    Then the rectangles should not overlap

  Scenario: Rectangle A entirely above rectangle B does not overlap
    Given rectangle A at x 0 y 0 width 10 height 10
    And rectangle B at x 0 y 100 width 10 height 10
    Then the rectangles should not overlap

  Scenario: Rectangles overlapping on both axes do overlap
    Given rectangle A at x 0 y 0 width 10 height 10
    And rectangle B at x 5 y 5 width 10 height 10
    Then the rectangles should overlap

  # --- Player bullet vs invaders ---

  Scenario: A player bullet destroys the invader it hits and scores according to its row
    Given the player bullet is positioned at the row 0 column 0 invader
    When player bullet collisions are processed
    Then the row 0 column 0 invader should be dead
    And the invaders score should increase by 30
    And no player bullet should exist
    And the last invaders event should be "invaderHit"

  Scenario: A player bullet destroys a lower-scoring row for fewer points
    Given the player bullet is positioned at the row 4 column 2 invader
    When player bullet collisions are processed
    Then the row 4 column 2 invader should be dead
    And the invaders score should increase by 10

  Scenario: A player bullet that misses every invader leaves the board unchanged
    Given the player bullet is positioned just past the row 0 column 0 invader's right edge
    When player bullet collisions are processed
    Then the row 0 column 0 invader should be alive
    And a player bullet should exist
    And the invaders score should not change

  Scenario: A player bullet passes through where a dead invader used to be
    Given the row 0 column 0 invader is dead
    And the player bullet is positioned at the row 0 column 0 invader
    When player bullet collisions are processed
    Then a player bullet should exist
    And the invaders score should not change

  # --- Invader bullet vs player ---

  Scenario: An invader bullet that hits the player is removed and costs a life
    Given an invader bullet is positioned exactly on the player
    When invader bullet collisions are processed
    Then the invaders lives should decrease by 1
    And that invader bullet should no longer be in flight

  Scenario: An invader bullet that just touches the player's edge does not hit
    Given an invader bullet is positioned just past the player's edge
    When invader bullet collisions are processed
    Then the invaders lives should not change
    And that invader bullet should still be in flight

  Scenario: Processing invader bullet collisions with no bullets in flight does nothing
    When invader bullet collisions are processed
    Then the invaders lives should not change
