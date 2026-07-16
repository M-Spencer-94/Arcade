Feature: Ghost Modes and Timing
  As a Pac-Man player
  I want ghosts to alternate between scatter, chase and frightened behaviour
  So that pursuit feels varied and eating a power pellet matters

  Background:
    Given a new Pac-Man game has started

  Scenario: A scattering ghost targets its scatter corner
    Then ghost 1's target should be its scatter corner

  Scenario: A chasing ghost targets the player's current position
    Given ghost 1 is in chase mode
    Then ghost 1's target should be the player's position

  Scenario: An eaten ghost targets its home tile
    Given ghost 1 is in eaten mode
    Then ghost 1's target should be its home tile

  Scenario: A frightened ghost has no target
    Given ghost 1 is in frightened mode
    Then ghost 1's target should be null

  Scenario: A normal ghost's move delay is 180ms
    Then ghost 1's move delay should be 180ms

  Scenario: A frightened ghost's move delay is 1.5x slower, at 270ms
    Given ghost 1 is in frightened mode
    Then ghost 1's move delay should be 270ms

  Scenario: A ghost does not move before its move delay elapses
    When ghost 1 updates for 179ms
    Then ghost 1 should not have moved

  Scenario: A ghost moves exactly when its move delay elapses
    When ghost 1 updates for 179ms
    And ghost 1 updates for 1ms
    Then ghost 1 should have moved

  Scenario: A frightened ghost does not move before its slower delay elapses
    Given ghost 1 is in frightened mode
    When ghost 1 updates for 269ms
    Then ghost 1 should not have moved

  Scenario: A frightened ghost moves exactly when its slower delay elapses
    Given ghost 1 is in frightened mode
    When ghost 1 updates for 269ms
    And ghost 1 updates for 1ms
    Then ghost 1 should have moved

  Scenario: pickDirectionTowards chooses the legal move that minimises distance to the target
    Given ghost 1 is at column 5 row 3
    When ghost 1 picks a direction towards column 10 row 3
    Then the picked direction should be right

  Scenario: pickDirectionTowards returns nothing when every neighbouring tile is a wall
    Given ghost 1 is boxed in with no legal moves
    When ghost 1 picks a direction towards column 0 row 0
    Then no direction should be available

  Scenario: A boxed-in ghost does not move even once its delay elapses
    Given ghost 1 is boxed in with no legal moves
    When ghost 1 updates for 180ms
    Then ghost 1 should not have moved

  Scenario: pickDirectionTowards picks among the legal directions when there is no target
    Given ghost 1 is at column 5 row 3
    When ghost 1 picks a direction with no target
    Then the picked direction should be a legal move

  Scenario: An eaten ghost that reaches its home tile leaves eaten mode
    Given ghost 1 is eaten and at its home tile
    When ghost 1 updates for 0ms
    Then ghost 1 should be in scatter mode

  Scenario: An eaten ghost away from its home tile stays eaten
    Given ghost 1 is eaten and away from its home tile
    When ghost 1 updates for 0ms
    Then ghost 1 should be in eaten mode

  Scenario: The global mode stays scatter just before the scatter duration elapses
    When the global mode timer advances by 4999ms
    Then the global mode should be scatter
    And every ghost should be in scatter mode

  Scenario: The global mode flips to chase exactly when the scatter duration elapses
    When the global mode timer advances by 4999ms
    And the global mode timer advances by 1ms
    Then the global mode should be chase
    And every ghost should be in chase mode

  Scenario: The global mode stays chase just before the chase duration elapses
    Given the global mode is chase
    When the global mode timer advances by 14999ms
    Then the global mode should be chase

  Scenario: The global mode flips back to scatter exactly when the chase duration elapses
    Given the global mode is chase
    When the global mode timer advances by 14999ms
    And the global mode timer advances by 1ms
    Then the global mode should be scatter
    And every ghost should be in scatter mode

  Scenario: A frightened ghost ignores global mode changes
    Given ghost 1 is in frightened mode
    When the global mode timer advances by 5000ms
    Then ghost 1 should be in frightened mode
    And every ghost except ghost 1 should be in chase mode

  Scenario: An eaten ghost ignores global mode changes
    Given ghost 2 is in eaten mode
    When the global mode timer advances by 5000ms
    Then ghost 2 should be in eaten mode
    And every ghost except ghost 2 should be in chase mode

  Scenario: The frightened timer does nothing when no ghost is frightened
    When the frightened timer counts down by 1000ms
    Then the frightened timer should be 0ms

  Scenario: The frightened timer keeps counting down before it expires
    Given the frightened timer is 6000ms
    And ghost 1 is in frightened mode
    When the frightened timer counts down by 5999ms
    Then the frightened timer should be 1ms
    And ghost 1 should be in frightened mode

  Scenario: The frightened timer expires exactly at zero and reverts frightened ghosts
    Given the frightened timer is 6000ms
    And ghost 1 is in frightened mode
    And the ghost chain count is 2
    When the frightened timer counts down by 5999ms
    And the frightened timer counts down by 1ms
    Then the frightened timer should be 0ms
    And ghost 1 should be in scatter mode
    And the ghost chain count should be 0

  Scenario: An eaten ghost is unaffected when the frightened timer expires
    Given the frightened timer is 6000ms
    And ghost 1 is in frightened mode
    And ghost 2 is in eaten mode
    When the frightened timer counts down by 6000ms
    Then ghost 1 should be in scatter mode
    And ghost 2 should be in eaten mode
