Feature: Ghost Chain Scoring
  As a Pac-Man player
  I want consecutive frightened-ghost kills to be worth escalating points
  So that chaining ghosts during one power pellet is worth pursuing

  Background:
    Given a new Pac-Man game has started

  Scenario Outline: Chain scoring increases with each consecutive frightened ghost eaten
    Given the ghost chain count is <count>
    And ghost 1 is at the player's position in frightened mode
    When ghost collisions are processed
    Then the Pac-Man score should increase by <points>

    Examples:
      | count | points |
      | 0     | 200    |
      | 1     | 400    |
      | 2     | 800    |
      | 3     | 1600   |

  Scenario: Chain scoring is capped at the fourth tier for a fifth consecutive ghost
    Given the ghost chain count is 4
    And ghost 1 is at the player's position in frightened mode
    When ghost collisions are processed
    Then the Pac-Man score should increase by 1600

  Scenario: Chain scoring remains capped far beyond the fourth tier
    Given the ghost chain count is 20
    And ghost 1 is at the player's position in frightened mode
    When ghost collisions are processed
    Then the Pac-Man score should increase by 1600

  Scenario: Each ghost eaten while frightened increments the chain count
    Given ghost 1 is at the player's position in frightened mode
    When ghost collisions are processed
    Then the ghost chain count should increase by 1
