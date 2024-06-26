const DataSource = require("../data-source");
const { allDistancesToTileType } = require("../lib/distance");
const { getTileTypeId } = require("../lib/config-helpers");
const Array2D = require("../lib/array-2d");
const {
  small_wake_effect,
  big_wake_effect,
} = require("../lib/energy-calculation");

class SlipstreamData extends DataSource {
  constructor(city, config) {
    super();
    this.city = city;
    this.cells = city.map.cells; // Matrix with tile types
    this.energyLoss = Array2D.create(city.map.width, this.city.map.height, 1); // matrix that saves the energy loss of every wt
    this.config = config;
    this.lifeSpan = 0;
    this.lifeSpanIndex = 5; // smiley
    this.arrayOfLoss = []; // arry with wt type and energy loss to calculate the energy

    // Group A: 0 tile distance inbetween |  |  |  |x|x|
    // Life expectancy Loss: x 0.5
    this.groupBigA = 0;
    // Group B: 1 tile distance inbetween |  |  |x|  |x|
    // Life expectancy: x 0.3
    this.groupBigB = 0;
    // Group C: 2 tile distance inbetween |  |x|  |  |x|
    // Life expectancy: x 0.2
    this.groupBigC = 0;
    // Group D: 3 tile distance inbetween |x|  |  |  |x|
    // Life expectancy: x 0.1
    this.groupBigD = 0;

    // These counters save the number of windturbines standing in the slipstream
    // of SMALL windturbines
    // Group 0: no wt standing in slipstream |  |  |  |  |x|
    // maximal energy gain x 1.0

    // Group A: 0 tile distance inbetween |  |  |  |x|x|
    // Life expectancy: x 0.4
    this.groupSmallA = 0;
    // Group B: 1 tile distance inbetween |  |  |x|  |x|
    // Life expectancy: x 0.2
    this.groupSmallB = 0;
    // Group C: 2 tile distance inbetween |  |x|  |  |x|
    // Life expectancy: x 0.1
    this.groupSmallC = 0;

    // The energy loss will be calculated differently
    // for wind turbines which stand in the slip stream of
    // either small or big ones.

    // --> (wind direction)
    // Energy Loss BIG WT --> BIG WT     // Energy Loss BIG WT --> SMAll WT
    //  |  |  |  |x|x| : 0.5             //  |  |  |  |x|x| :  0.25
    //  |  |  |x|  |x| : 0.39             //  |  |  |x|  |x| : 0.195
    //  |  |x|  |  |x| : 0.18             //  |  |x|  |  |x| : 0.09
    //  |x|  |  |  |x| : 0.05             //  |x|  |  |  |x| : 0.025

    // Energy Loss SMALL WT --> SMALL WT     // Energy Loss SMALL WT --> BIG WT
    //  |  |  |  |x|x| : 0.25            //  |  |  |  |x|x| : 0.175
    //  |  |  |x|  |x| : 0.19            //  |  |  |x|  |x| : 0.08
    //  |  |x|  |  |x| : 0.09            //  |  |x|  |  |x| : 0.018

    this.elBigBigZero = big_wake_effect(1);
    this.elBigBigOne = big_wake_effect(2);
    this.elBigBigTwo = big_wake_effect(3);
    this.elBigBigThree = big_wake_effect(4);

    this.elBigSmallZero = big_wake_effect(1) / 2;
    this.elBigSmallOne = big_wake_effect(2) / 2;
    this.elBigSmallTwo = big_wake_effect(3) / 2;
    this.elBigSmallThree = big_wake_effect(4) / 2;

    this.elSmallSmallZero = small_wake_effect(1);
    this.elSmallSmallOne = small_wake_effect(2);
    this.elSmallSmallTwo = small_wake_effect(3);

    this.elSmallBigZero = small_wake_effect(1) / 2;
    this.elSmallBigOne = small_wake_effect(2) / 2;
    this.elSmallBigTwo = small_wake_effect(3) / 2;

    this.windTurbineSmallId = getTileTypeId(this.config, "windTurbineSmall");
    this.windTurbineBigId = getTileTypeId(this.config, "windTurbineBig");
  }
  getVariables() {
    return {
      "life-span-index": () => this.lifeSpanIndex,
      "energy-losses": () => this.arrayOfLoss,
    };
  }
  /**
   * calculates the energy loss caused by placement and slipstreams for every wind trubine
   * @param {*} windDirection | The by the User selected wind direction as a String
   */
  calculate(windDirection) {
    this.energyLoss = Array2D.create(
      this.city.map.width,
      this.city.map.height,
      1
    );
    this.groupBigA = 0;
    this.groupBigB = 0;
    this.groupBigC = 0;
    this.groupBigD = 0;
    this.groupSmallA = 0;
    this.groupSmallB = 0;
    this.groupSmallC = 0;
    switch (windDirection) {
      // NORTH
      case "N":
        this.calculateSlipstreamN();
        break;
      // EAST
      case "O":
        this.calculateSlipstreamE();
        break;
      // SOUTH
      case "S":
        this.calculateSlipstreamS();
        break;
      //WEST
      case "W":
        this.calculateSlipstreamW();
        break;
    }
    this.calculateLifeSpan();
    this.saveEngeryLosses();
  }
  /**
   * saves all energy losses and the according wt type in an array for calculating the final energy gain
   */
  saveEngeryLosses() {
    this.arrayOfLoss = [];
    for (let col = 0; col < 16; col++) {
      for (let row = 0; row < 16; row++) {
        if (this.cells[row][col] == this.windTurbineSmallId) {
          let energyLossSmall = [];
          energyLossSmall.push(
            this.energyLoss[row][col],
            this.windTurbineSmallId
          );
          this.arrayOfLoss.push(energyLossSmall);
        }
        if (this.cells[row][col] == this.windTurbineBigId) {
          let energyLossBig = [];
          energyLossBig.push(this.energyLoss[row][col], this.windTurbineBigId);
          this.arrayOfLoss.push(energyLossBig);
        }
      }
    }
  }
  /**
   * calculates the average life span of a windturbine
   * the life span is reduced by turbulences caused by placement and slipstreams
   */
  calculateLifeSpan() {
    if (
      this.groupBigA +
        this.groupBigB +
        this.groupBigC +
        this.groupBigD +
        this.groupSmallA +
        this.groupSmallB +
        this.groupSmallC >
      0
    ) {
      this.lifeSpan =
        (0.5 * this.groupBigA +
          0.3 * this.groupBigB +
          0.2 * this.groupBigC +
          0.1 * this.groupBigD +
          0.4 * this.groupSmallA +
          0.2 * this.groupSmallB +
          0.1 * this.groupSmallC) /
        (this.groupBigA +
          this.groupBigB +
          this.groupBigC +
          this.groupBigD +
          this.groupSmallA +
          this.groupSmallB +
          this.groupSmallC);

      if (this.lifeSpan <= 0.2) {
        this.lifeSpanIndex = 4;
      } else if (this.lifeSpan <= 0.3) {
        this.lifeSpanIndex = 3;
      } else if (this.lifeSpan <= 0.4) {
        this.lifeSpanIndex = 2;
      } else if (this.lifeSpan <= 0.5) {
        this.lifeSpanIndex = 1;
      }
    } else {
      this.lifeSpan = 0;
      this.lifeSpanIndex = 5;
    }
  }

  /**
   * calculates the energy loss
   * caused by slipstreams from other windturbines when the main wind direction is
   * NORTH
   * for-loops: >  v
   * goes from left to right (west-east) through the city columns
   * and looks at each cell from top to bottom (north-south)
   */
  calculateSlipstreamN() {
    for (let col = 0; col < 16; col++) {
      for (let j = 1; j < 16; j++) {
        let type = this.cells[j][col];
        if (
          j < 4 &&
          (type == this.windTurbineSmallId || type == this.windTurbineBigId)
        ) {
          this.checkFirstFourN(j, col, j, type, j - 1, j - 2, j - 3);
        } else {
          if (
            type == this.windTurbineSmallId ||
            type == this.windTurbineBigId
          ) {
            // small WT behind small WT  |  |  |  |x|x|
            if (
              this.cells[j - 1][col] == this.windTurbineSmallId &&
              this.cells[j][col] == this.windTurbineSmallId
            ) {
              this.groupSmallA++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elSmallSmallZero,
                this.energyLoss[j - 1][col]
              );
              // small WT behind big WT  |  |  |  |x|x|
            } else if (
              this.cells[j - 1][col] == this.windTurbineBigId &&
              this.cells[j][col] == this.windTurbineSmallId
            ) {
              this.groupBigB++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elBigSmallZero,
                this.energyLoss[j - 1][col]
              );
            }
            // big WT behind small WT  |  |  |  |x|x|
            else if (
              this.cells[j - 1][col] == this.windTurbineSmallId &&
              this.cells[j][col] == this.windTurbineBigId
            ) {
              this.groupSmallB++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elSmallBigZero,
                this.energyLoss[j - 1][col]
              );
              // big WT behind big WT  |  |  |  |x|x|
            } else if (
              this.cells[j - 1][col] == this.windTurbineBigId &&
              this.cells[j][col] == this.windTurbineBigId
            ) {
              this.groupBigA++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elBigBigZero,
                this.energyLoss[j - 1][col]
              );
            }
            // small WT behind small WT  |  |  |x|  |x|
            else if (
              this.cells[j - 2][col] == this.windTurbineSmallId &&
              this.cells[j][col] == this.windTurbineSmallId
            ) {
              this.groupSmallB++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elSmallSmallOne,
                this.energyLoss[j - 2][col]
              );
            }
            // small WT behind big WT  |  |  |x|  |x|
            else if (
              this.cells[j - 2][col] == this.windTurbineBigId &&
              this.cells[j][col] == this.windTurbineSmallId
            ) {
              this.groupBigC++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elBigSmallOne,
                this.energyLoss[j - 2][col]
              );
            }
            // big WT behind small WT  |  |  |x|  |x|
            else if (
              this.cells[j - 2][col] == this.windTurbineSmallId &&
              this.cells[j][col] == this.windTurbineBigId
            ) {
              this.groupSmallC++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elSmallBigOne,
                this.energyLoss[j - 2][col]
              );
            }
            // big WT behind big WT  |  |  |x|  |x|
            else if (
              this.cells[j - 2][col] == this.windTurbineBigId &&
              this.cells[j][col] == this.windTurbineBigId
            ) {
              this.groupBigB++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elBigBigOne,
                this.energyLoss[j - 1][col]
              );
            }
            // small WT behind small WT  |  |x|  |  |x|
            else if (
              this.cells[j - 3][col] == this.windTurbineSmallId &&
              this.cells[j][col] == this.windTurbineSmallId
            ) {
              this.groupSmallC++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elSmallSmallTwo,
                this.energyLoss[j - 3][col]
              );
            }
            // small WT behind big WT  |  |x|  |  |x|
            else if (
              this.cells[j - 3][col] == this.windTurbineBigId &&
              this.cells[j][col] == this.windTurbineSmallId
            ) {
              this.groupBigD++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elBigSmallTwo,
                this.energyLoss[j - 3][col]
              );
            }
            // big WT behind small WT  |  |x|  |  |x|
            else if (
              this.cells[j - 3][col] == this.windTurbineSmallId &&
              this.cells[j][col] == this.windTurbineBigId
            ) {
              this.calculateEnergyLoss(
                col,
                j,
                this.elSmallBigTwo,
                this.energyLoss[j - 3][col]
              );
            }
            // big WT behind big WT  |  |x|  |  |x|
            else if (
              this.cells[j - 3][col] == this.windTurbineBigId &&
              this.cells[j][col] == this.windTurbineBigId
            ) {
              this.groupBigC++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elBigBigTwo,
                this.energyLoss[j - 3][col]
              );
            }
            // small WT behind big WT  |x|  |  |  |x|
            else if (
              this.cells[j - 4][col] == this.windTurbineBigId &&
              this.cells[j][col] == this.windTurbineSmallId
            ) {
              this.calculateEnergyLoss(
                col,
                j,
                this.elBigSmallThree,
                this.energyLoss[j - 4][col]
              );
            }
            // big WT behind big WT  |x|  |  |  |x|
            else if (
              this.cells[j - 4][col] == this.windTurbineBigId &&
              this.cells[j][col] == this.windTurbineBigId
            ) {
              this.groupBigD++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elBigBigThree,
                this.energyLoss[j - 4][col]
              );
            }
          }
        }
      }
    }
  }
  /**
   * calculates the energy loss matrix (this.energyloss) of
   * SMALL WTs caused by slipstreams from other windturbines when the main wind direction is
   * EAST
   * for-loops: v <
   * goes from top to bottom (north-soth) through the city rows
   * and looks at each cell from left to right (east-west)
   */
  calculateSlipstreamE() {
    for (let row = 0; row < 16; row++) {
      for (let j = 14; j >= 0; j--) {
        let type = this.cells[row][j];
        if (
          j > 11 &&
          (type == this.windTurbineSmallId || type == this.windTurbineBigId)
        ) {
          this.checkFirstFourE(j, j, row, type, j + 1, j + 2, j + 3);
        } else {
          if (
            type == this.windTurbineSmallId ||
            type == this.windTurbineBigId
          ) {
            // small WT behind small WT  |  |  |  |x|x|
            if (
              this.windTurbineSmallId == this.cells[row][j + 1] &&
              type == this.windTurbineSmallId
            ) {
              this.groupSmallA++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elSmallSmallZero,
                this.energyLoss[row][j + 1]
              );
            }
            // small WT behind big WT  |  |  |  |x|x|
            else if (
              this.windTurbineBigId == this.cells[row][j + 1] &&
              type == this.windTurbineSmallId
            ) {
              this.groupBigB++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elBigSmallZero,
                this.energyLoss[row][j + 1]
              );
            }
            // big WT behind small WT  |  |  |  |x|x|
            if (
              this.windTurbineSmallId == this.cells[row][j + 1] &&
              type == this.windTurbineBigId
            ) {
              this.groupSmallB++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elSmallBigZero,
                this.energyLoss[row][j + 1]
              );
            }
            // big WT behind big WT  |  |  |  |x|x|
            else if (
              this.windTurbineBigId == this.cells[row][j + 1] &&
              type == this.windTurbineBigId
            ) {
              this.groupBigA++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elBigBigZero,
                this.energyLoss[row][j + 1]
              );
            }
            // small WT behind small WT  |  |  |x|  |x|
            else if (
              this.windTurbineSmallId == this.cells[row][j + 2] &&
              type == this.windTurbineSmallId
            ) {
              this.groupSmallB++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elSmallSmallOne,
                this.energyLoss[row][j + 2]
              );
            }
            // small WT behind big WT  |  |  |x|  |x|
            else if (
              this.windTurbineBigId == this.cells[row][j + 2] &&
              type == this.windTurbineSmallId
            ) {
              this.groupBigC++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elBigSmallOne,
                this.energyLoss[row][j + 2]
              );
            }
            // big WT behind small WT  |  |  |x|  |x|
            else if (
              this.windTurbineSmallId == this.cells[row][j + 2] &&
              type == this.windTurbineBigId
            ) {
              this.groupSmallC++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elSmallBigOne,
                this.energyLoss[row][j + 2]
              );
            }
            // big WT behind big WT  |  |  |x|  |x|
            else if (
              this.windTurbineBigId == this.cells[row][j + 2] &&
              type == this.windTurbineBigId
            ) {
              this.groupBigB++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elBigBigOne,
                this.energyLoss[row][j + 2]
              );
            }
            // small WT behind small WT  |  |x|  |  |x|
            else if (
              this.windTurbineSmallId == this.cells[row][j + 3] &&
              type == this.windTurbineSmallId
            ) {
              this.groupSmallC++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elSmallSmallTwo,
                this.energyLoss[row][j + 3]
              );
            }
            // small WT behind big WT  |  |x|  |  |x|
            else if (
              this.windTurbineBigId == this.cells[row][j + 3] &&
              type == this.windTurbineSmallId
            ) {
              this.groupBigD++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elBigSmallTwo,
                this.energyLoss[row][j + 3]
              );
            }
            // big WT behind small WT  |  |x|  |  |x|
            else if (
              this.windTurbineSmallId == this.cells[row][j + 3] &&
              type == this.windTurbineBigId
            ) {
              this.calculateEnergyLoss(
                j,
                row,
                this.elSmallBigTwo,
                this.energyLoss[row][j + 3]
              );
            }
            // big WT behind big WT  |  |x|  |  |x|
            else if (
              this.windTurbineBigId == this.cells[row][j + 3] &&
              type == this.windTurbineBigId
            ) {
              this.groupBigC++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elBigBigTwo,
                this.energyLoss[row][j + 3]
              );
            }
            // small WT behind big WT  |x|  |  |  |x|
            else if (
              this.windTurbineBigId == this.cells[row][j + 4] &&
              type == this.windTurbineSmallId
            ) {
              this.calculateEnergyLoss(
                j,
                row,
                this.elBigSmallThree,
                this.energyLoss[row][j + 4]
              );
            }
            // big WT behind big WT  |x|  |  |  |x|
            else if (
              this.windTurbineBigId == this.cells[row][j + 4] &&
              type == this.windTurbineBigId
            ) {
              this.groupBigD++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elBigBigThree,
                this.energyLoss[row][j + 4]
              );
            }
          }
        }
      }
    }
  }
  /**
   * calculates the energy loss matrix (this.energyloss) of
   * SMALL WTs caused by slipstreams from other windturbines when the main wind direction is
   * SOUTH
   * for-loops: > ^
   * goes from left to right (west-east) through the city columns
   * and looks at each cell from bottom to top (south-north)
   */
  calculateSlipstreamS() {
    for (let col = 0; col < 16; col++) {
      for (let j = 14; j >= 0; j--) {
        let type = this.cells[j][col];
        if (
          j > 11 &&
          (type == this.windTurbineSmallId || type == this.windTurbineBigId)
        ) {
          this.checkFirstFourS(j, col, j, type, j + 1, j + 2, j + 3);
        } else {
          if (
            type == this.windTurbineSmallId ||
            type == this.windTurbineBigId
          ) {
            // small WT behind small WT  |  |  |  |x|x|
            if (
              this.windTurbineSmallId == this.cells[j + 1][col] &&
              this.cells[j][col] == this.windTurbineSmallId
            ) {
              this.groupSmallA++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elSmallSmallZero,
                this.energyLoss[j + 1][col]
              );
            }
            // small WT behind big WT  |  |  |  |x|x|
            else if (
              this.cells[j + 1][col] == this.windTurbineBigId &&
              this.cells[j][col] == this.windTurbineSmallId
            ) {
              this.groupBigB++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elBigSmallZero,
                this.energyLoss[j + 1][col]
              );
            }
            // big WT behind small WT  |  |  |  |x|x|
            if (
              this.cells[j + 1][col] == this.windTurbineSmallId &&
              this.cells[j][col] == this.windTurbineBigId
            ) {
              this.groupSmallA++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elSmallBigZero,

                this.energyLoss[j + 1][col]
              );
              // big WT behind big WT  |  |  |  |x|x|
            } else if (
              this.cells[j + 1][col] == this.windTurbineBigId &&
              this.cells[j][col] == this.windTurbineBigId
            ) {
              this.groupBigA++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elBigBigZero,

                this.energyLoss[j + 1][col]
              );
            }
            // small WT behind small WT  |  |  |x|  |x|
            else if (
              this.cells[j + 2][col] == this.windTurbineSmallId &&
              this.cells[j][col] == this.windTurbineSmallId
            ) {
              this.groupSmallB++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elSmallSmallOne,
                this.energyLoss[j + 2][col]
              );
            }
            // small WT behind big WT  |  |  |x|  |x|
            else if (
              this.cells[j + 2][col] == this.windTurbineBigId &&
              this.cells[j][col] == this.windTurbineSmallId
            ) {
              this.groupBigC++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elBigSmallOne,
                this.energyLoss[j + 2][col]
              );
            }
            // big WT behind small WT  |  |  |x|  |x|
            else if (
              this.cells[j + 2][col] == this.windTurbineSmallId &&
              this.cells[j][col] == this.windTurbineBigId
            ) {
              this.groupSmallB++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elSmallBigOne,

                this.energyLoss[j + 2][col]
              );
            }
            // big WT behind big WT  |  |  |x|  |x|
            else if (
              this.cells[j + 2][col] == this.windTurbineBigId &&
              this.cells[j][col] == this.windTurbineBigId
            ) {
              this.groupBigB++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elBigBigOne,
                this.energyLoss[j + 2][col]
              );
            }
            // small WT behind small WT  |  |x|  |  |x|
            else if (
              this.cells[j + 3][col] == this.windTurbineSmallId &&
              this.cells[j][col] == this.windTurbineSmallId
            ) {
              this.groupSmallC++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elSmallSmallTwo,
                this.energyLoss[j + 3][col]
              );
            }
            // small WT behind big WT  |  |x|  |  |x|
            else if (
              this.cells[j + 3][col] == this.windTurbineBigId &&
              this.cells[j][col] == this.windTurbineSmallId
            ) {
              this.groupBigD++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elBigSmallTwo,
                this.energyLoss[j + 3][col]
              );
            }
            // big WT behind small WT  |  |x|  |  |x|
            else if (
              this.cells[j + 3][col] == this.windTurbineSmallId &&
              this.cells[j][col] == this.windTurbineBigId
            ) {
              this.groupSmallC++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elSmallBigTwo,
                this.energyLoss[j + 3][col]
              );
            }
            // big WT behind big WT  |  |x|  |  |x|
            else if (
              this.cells[j + 3][col] == this.windTurbineBigId &&
              this.cells[j][col] == this.windTurbineBigId
            ) {
              this.groupBigC++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elBigBigTwo,
                this.energyLoss[j + 3][col]
              );
            }
            // small WT behind big WT  |x|  |  |  |x|
            else if (
              this.cells[j + 4][col] == this.windTurbineBigId &&
              this.cells[j][col] == this.windTurbineSmallId
            ) {
              this.calculateEnergyLoss(
                col,
                j,
                this.elBigSmallThree,
                this.energyLoss[j + 4][col]
              );
            }
            // big WT behind big WT  |x|  |  |  |x|
            else if (
              this.cells[j + 4][col] == this.windTurbineBigId &&
              this.cells[j][col] == this.windTurbineBigId
            ) {
              this.groupBigD++;
              this.calculateEnergyLoss(
                col,
                j,
                this.elBigBigThree,
                this.energyLoss[j + 4][col]
              );
            }
          }
        }
      }
    }
  }

  /**
   * calculates the energy loss matrix (this.energyloss) of
   * SMALL WTs caused by slipstreams from other windturbines when the main wind direction is
   * EAST
   * for-loops: v <
   * goes from top to bottom (north-soth) through the city rows
   * and looks at each cell from right to left (west-east)
   */
  calculateSlipstreamW() {
    for (let row = 0; row < 16; row++) {
      for (let j = 1; j < 16; j++) {
        let type = this.cells[row][j];
        if (
          j < 4 &&
          (type == this.windTurbineSmallId || type == this.windTurbineBigId)
        ) {
          this.checkFirstFourW(j, j, row, type, j - 1, j - 2, j - 3);
        } else {
          if (
            type == this.windTurbineSmallId ||
            type == this.windTurbineBigId
          ) {
            // small WT behind small WT  |  |  |  |x|x|
            if (
              this.windTurbineSmallId == this.cells[row][j - 1] &&
              type == this.windTurbineSmallId
            ) {
              this.groupSmallA++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elSmallSmallZero,
                this.energyLoss[row][j - 1]
              );
            }
            // small WT behind big WT  |  |  |  |x|x|
            else if (
              this.windTurbineBigId == this.cells[row][j - 1] &&
              type == this.windTurbineSmallId
            ) {
              this.groupBigB++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elBigSmallZero,
                this.energyLoss[row][j - 1]
              );
            }
            // big WT behind small WT  |  |  |  |x|x|
            if (
              this.windTurbineSmallId == this.cells[row][j - 1] &&
              type == this.windTurbineBigId
            ) {
              this.groupSmallB++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elSmallBigZero,
                this.energyLoss[row][j - 1]
              );
            }
            // big WT behind big WT  |  |  |  |x|x|
            else if (
              this.windTurbineBigId == this.cells[row][j - 1] &&
              type == this.windTurbineBigId
            ) {
              this.groupBigA++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elBigBigZero,
                this.energyLoss[row][j - 1]
              );
            }
            // small WT behind small WT  |  |  |x|  |x|
            else if (
              this.windTurbineSmallId == this.cells[row][j - 2] &&
              type == this.windTurbineSmallId
            ) {
              this.groupSmallB++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elSmallSmallOne,
                this.energyLoss[row][j - 2]
              );
            }
            // small WT behind big WT  |  |  |x|  |x|
            else if (
              this.windTurbineBigId == this.cells[row][j - 2] &&
              type == this.windTurbineSmallId
            ) {
              this.groupBigC++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elBigSmallOne,
                this.energyLoss[row][j - 2]
              );
            }
            // big WT behind small WT  |  |  |x|  |x|
            else if (
              this.windTurbineSmallId == this.cells[row][j - 2] &&
              type == this.windTurbineBigId
            ) {
              this.groupSmallC++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elSmallBigOne,
                this.energyLoss[row][j - 2]
              );
            }
            // big WT behind big WT  |  |  |x|  |x|
            else if (
              this.windTurbineBigId == this.cells[row][j - 2] &&
              type == this.windTurbineBigId
            ) {
              this.groupBigB++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elBigBigOne,
                this.energyLoss[row][j - 2]
              );
            }
            // small WT behind small WT  |  |x|  |  |x|
            else if (
              this.windTurbineSmallId == this.cells[row][j - 3] &&
              type == this.windTurbineSmallId
            ) {
              this.groupSmallC++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elSmallSmallTwo,
                this.energyLoss[row][j - 3]
              );
            }
            // small WT behind big WT  |  |x|  |  |x|
            else if (
              this.windTurbineBigId == this.cells[row][j - 3] &&
              type == this.windTurbineSmallId
            ) {
              this.groupBigD++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elBigSmallTwo,
                this.energyLoss[row][j - 3]
              );
            }
            // big WT behind small WT  |  |x|  |  |x|
            else if (
              this.windTurbineSmallId == this.cells[row][j - 3] &&
              type == this.windTurbineBigId
            ) {
              this.calculateEnergyLoss(
                j,
                row,
                this.elSmallBigTwo,
                this.energyLoss[row][j - 3]
              );
            }
            // big WT behind big WT  |  |x|  |  |x|
            else if (
              this.windTurbineBigId == this.cells[row][j - 3] &&
              type == this.windTurbineBigId
            ) {
              this.groupBigC++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elBigBigTwo,
                this.energyLoss[row][j - 3]
              );
            }
            // big WT behind big WT  |x|  |  |  |x|
            else if (
              this.windTurbineBigId == this.cells[row][j - 4] &&
              type == this.windTurbineBigId
            ) {
              this.groupBigD++;
              this.calculateEnergyLoss(
                j,
                row,
                this.elBigBigThree,
                this.energyLoss[row][j - 4]
              );
            }
            // small WT behind big WT  |x|  |  |  |x|
            else if (
              this.windTurbineBigId == this.cells[row][j - 4] &&
              type == this.windTurbineSmallId
            ) {
              this.calculateEnergyLoss(
                j,
                row,
                this.elBigSmallThree,
                this.energyLoss[row][j - 4]
              );
            }
          }
        }
      }
    }
  }

  /**
   * calculates the energy loss of
   * SMALL WTs of the first four cells in wind direction for small WTs
   * NORTH
   * this might be a bit complicated - maybe there is a solution with a simple if statemnt which checks if j is out of bounds
   * @param {*} j | either the col (east-, west wind) or row (north-, south wind)
   * @param {*} col | the column the looked at cell is in
   * @param {*} row | the row the looked at cell is in
   * @param {*} type | the type of the looked at cell
   * @param {*} firstNeighbour | the col or row number of the first neighbour
   * @param {*} secondNeighbour | the col or row number of the second neighbour
   * @param {*} thirdNeighbour | the col or row number of the third neighbour
   */
  checkFirstFourN(
    j,
    col,
    row,
    type,
    firstNeighbour,
    secondNeighbour,
    thirdNeighbour
  ) {
    switch (j) {
      case 1:
        // small WT behind small WT  |  |  |  |x|x|
        if (
          this.windTurbineSmallId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        // small WT behind big WT  |  |  |  |x|x|
        else if (
          this.windTurbineBigId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        // big WT behind small WT  |  |  |  |x|x|
        if (this.windTurbineSmallId == this.cells[firstNeighbour][col]) {
          this.groupSmallB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        // big WT behind big WT  |  |  |  |x|x|
        else if (this.windTurbineBigId == this.cells[firstNeighbour][col]) {
          this.groupBigA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        // big WT behind small WT  |  |  |  |x|x|
        if (
          this.windTurbineSmallId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.groupSmallB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        // big WT behind big WT  |  |  |  |x|x|
        else if (
          this.windTurbineBigId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        break;
      case 2:
        // small WT behind small WT  |  |  |  |x|x|
        if (
          this.windTurbineSmallId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        // small WT behind big WT  |  |  |  |x|x|
        else if (
          this.windTurbineBigId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        // big WT behind small WT  |  |  |  |x|x|
        if (
          this.windTurbineSmallId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.groupSmallB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        // big WT behind big WT  |  |  |  |x|x|
        else if (
          this.windTurbineBigId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        // small WT behind small WT  |  |  |x|  |x|
        else if (
          this.windTurbineSmallId == this.cells[secondNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallOne,
            this.energyLoss[secondNeighbour][col]
          );
        }
        // small WT behind big WT  |  |  |x|  |x|
        else if (
          this.windTurbineBigId == this.cells[secondNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigC++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallOne,
            this.energyLoss[secondNeighbour][col]
          );
        }
        // big WT behind small WT  |  |  |x|  |x|
        else if (
          this.windTurbineSmallId == this.cells[secondNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.groupSmallC++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigOne,
            this.energyLoss[secondNeighbour][col]
          );
        }
        // big WT behind big WT  |  |  |x|  |x|
        else if (
          this.windTurbineBigId == this.cells[secondNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigOne,
            this.energyLoss[secondNeighbour][col]
          );
        }
        break;
      case 3:
        // small WT behind small WT  |  |  |  |x|x|
        if (
          this.windTurbineSmallId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        // small WT behind big WT  |  |  |  |x|x|
        else if (
          this.windTurbineBigId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        // big WT behind small WT  |  |  |  |x|x|
        if (
          this.windTurbineSmallId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.groupSmallB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        // big WT behind big WT  |  |  |  |x|x|
        else if (
          this.windTurbineBigId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        // small WT behind small WT  |  |  |x|  |x|
        else if (
          this.windTurbineSmallId == this.cells[secondNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallOne,
            this.energyLoss[secondNeighbour][col]
          );
        }
        // small WT behind big WT  |  |  |x|  |x|
        else if (
          this.windTurbineBigId == this.cells[secondNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigC++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallOne,
            this.energyLoss[secondNeighbour][col]
          );
        }
        // big WT behind small WT  |  |  |x|  |x|
        else if (
          this.windTurbineSmallId == this.cells[secondNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.groupSmallC++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigOne,
            this.energyLoss[secondNeighbour][col]
          );
        }
        // big WT behind big WT  |  |  |x|  |x|
        else if (
          this.windTurbineBigId == this.cells[secondNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigOne,
            this.energyLoss[secondNeighbour][col]
          );
        }
        // small WT behind small WT  |  |x|  |  |x|
        else if (
          this.windTurbineSmallId == this.cells[thirdNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallC++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallTwo,
            this.energyLoss[thirdNeighbour][col]
          );
        }
        // small WT behind big WT  |  |x|  |  |x|
        else if (
          this.windTurbineBigId == this.cells[thirdNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigD++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallTwo,
            this.energyLoss[thirdNeighbour][col]
          );
        }
        // big WT behind small WT  |  |x|  |  |x|
        else if (
          this.windTurbineSmallId == this.cells[thirdNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigTwo,
            this.energyLoss[thirdNeighbour][col]
          );
        }
        // big WT behind big WT  |  |x|  |  |x|
        else if (
          this.windTurbineBigId == this.cells[thirdNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigC++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigTwo,
            this.energyLoss[thirdNeighbour][col]
          );
        }
        break;
    }
  }

  /**
   * calculates the energy loss of the first four cells in wind direction fro small Wts
   * EAST
   * this might be a bit complicated - maybe there is a solution with a simple if statemnt which checks if j is out of bounds
   * @param {*} j | either the col (east-, west wind) or row (north-, south wind)
   * @param {*} col | the column the looked at cell is in
   * @param {*} row | the row the looked at cell is in
   * @param {*} type | the type of the looked at cell
   * @param {*} firstNeighbour | the col or row number of the first neighbour
   * @param {*} secondNeighbour | the col or row number of the second neighbour
   * @param {*} thirdNeighbour | the col or row number of the third neighbour
   */
  checkFirstFourE(
    j,
    col,
    row,
    type,
    firstNeighbour,
    secondNeighbour,
    thirdNeighbour
  ) {
    switch (j) {
      case 14:
        // small WT behind small WT  |  |  |  |x|x|
        if (
          this.windTurbineSmallId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallZero,
            this.energyLoss[row][firstNeighbour]
          );
        }
        // small WT behind big WT  |  |  |  |x|x|
        else if (
          this.windTurbineBigId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallZero,
            this.energyLoss[row][firstNeighbour]
          );
        }
        // big WT behind small WT  |  |  |  |x|x|
        if (
          this.windTurbineSmallId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.groupSmallB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigZero,
            this.energyLoss[row][firstNeighbour]
          );
        }
        // big WT behind big WT  |  |  |  |x|x|
        else if (
          this.windTurbineBigId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigZero,
            this.energyLoss[row][firstNeighbour]
          );
        }
        break;
      case 13:
        // small WT behind small WT  |  |  |  |x|x|
        if (
          this.windTurbineSmallId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallZero,
            this.energyLoss[row][firstNeighbour]
          );
        }
        // small WT behind big WT  |  |  |  |x|x|
        else if (
          this.windTurbineBigId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallZero,
            this.energyLoss[row][firstNeighbour]
          );
        }
        // big WT behind small WT  |  |  |  |x|x|
        if (
          this.windTurbineSmallId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.groupSmallB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigZero,
            this.energyLoss[row][firstNeighbour]
          );
        }
        // big WT behind big WT  |  |  |  |x|x|
        else if (
          this.windTurbineBigId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigZero,
            this.energyLoss[row][firstNeighbour]
          );
        }
        // small WT behind small WT  |  |  |x|  |x|
        else if (
          this.windTurbineSmallId == this.cells[row][secondNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallOne,
            this.energyLoss[row][secondNeighbour]
          );
        }
        // small WT behind big WT  |  |  |x|  |x|
        else if (
          this.windTurbineBigId == this.cells[row][secondNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigC++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallOne,
            this.energyLoss[row][secondNeighbour]
          );
        }
        // big WT behind small WT  |  |  |x|  |x|
        else if (
          this.windTurbineSmallId == this.cells[row][secondNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.groupSmallC++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigOne,
            this.energyLoss[row][secondNeighbour]
          );
        }
        // big WT behind big WT  |  |  |x|  |x|
        else if (
          this.windTurbineBigId == this.cells[row][secondNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigOne,
            this.energyLoss[row][secondNeighbour]
          );
        }
        break;
      case 12:
        // small WT behind small WT  |  |  |  |x|x|
        if (
          this.windTurbineSmallId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallZero,
            this.energyLoss[row][firstNeighbour]
          );
        }
        // small WT behind big WT  |  |  |  |x|x|
        else if (
          this.windTurbineBigId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallZero,
            this.energyLoss[row][firstNeighbour]
          );
        }
        // big WT behind small WT  |  |  |  |x|x|
        if (
          this.windTurbineSmallId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.groupSmallB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigZero,
            this.energyLoss[row][firstNeighbour]
          );
        }
        // big WT behind big WT  |  |  |  |x|x|
        else if (
          this.windTurbineBigId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigZero,
            this.energyLoss[row][firstNeighbour]
          );
        }
        // small WT behind small WT  |  |  |x|  |x|
        else if (
          this.windTurbineSmallId == this.cells[row][secondNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallOne,
            this.energyLoss[row][secondNeighbour]
          );
        }
        // small WT behind big WT  |  |  |x|  |x|
        else if (
          this.windTurbineBigId == this.cells[row][secondNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigC++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallOne,
            this.energyLoss[row][secondNeighbour]
          );
        }
        // big WT behind small WT  |  |  |x|  |x|
        else if (
          this.windTurbineSmallId == this.cells[row][secondNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.groupSmallC++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigOne,
            this.energyLoss[row][secondNeighbour]
          );
        }
        // big WT behind big WT  |  |  |x|  |x|
        else if (
          this.windTurbineBigId == this.cells[row][secondNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigOne,
            this.energyLoss[row][secondNeighbour]
          );
        }
        // small WT behind small WT  |  |x|  |  |x|
        else if (
          this.windTurbineSmallId == this.cells[row][thirdNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallC++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallTwo,
            this.energyLoss[row][thirdNeighbour]
          );
        }
        // small WT behind big WT  |  |x|  |  |x|
        else if (
          this.windTurbineBigId == this.cells[row][thirdNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigD++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallTwo,
            this.energyLoss[row][thirdNeighbour]
          );
        }
        // big WT behind small WT  |  |x|  |  |x|
        else if (
          this.windTurbineSmallId == this.cells[row][thirdNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigTwo,
            this.energyLoss[row][thirdNeighbour]
          );
        }
        // big WT behind big WT  |  |x|  |  |x|
        else if (
          this.windTurbineBigId == this.cells[row][thirdNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigD++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigTwo,
            this.energyLoss[row][thirdNeighbour]
          );
        }
        break;
    }
  }

  /**
   * calculates the energy loss of the first four cells in wind direction fro small WTs
   * SOUTH
   * this might be a bit complicated - maybe there is a solution with a simple if statemnt which checks if j is out of bounds
   * @param {*} j | either the col (east-, west wind) or row (north-, south wind)
   * @param {*} col | the column the looked at cell is in
   * @param {*} row | the row the looked at cell is in
   * @param {*} type | the type of the looked at cell
   * @param {*} firstNeighbour | the col or row number of the first neighbour
   * @param {*} secondNeighbour | the col or row number of the second neighbour
   * @param {*} thirdNeighbour | the col or row number of the third neighbour
   */
  checkFirstFourS(
    j,
    col,
    row,
    type,
    firstNeighbour,
    secondNeighbour,
    thirdNeighbour
  ) {
    switch (j) {
      case 14:
        // small WT behind small WT  |  |  |  |x|x|
        if (
          this.windTurbineSmallId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        // small WT behind big WT  |  |  |  |x|x|
        else if (
          this.windTurbineBigId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        // big WT behind small WT  |  |  |  |x|x|
        if (
          this.windTurbineSmallId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.groupSmallB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        // big WT behind big WT  |  |  |  |x|x|
        else if (
          this.windTurbineBigId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        break;
      case 13:
        // small WT behind small WT  |  |  |  |x|x|
        if (
          this.windTurbineSmallId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        // small WT behind big WT  |  |  |  |x|x|
        else if (
          this.windTurbineBigId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        // big WT behind small WT  |  |  |  |x|x|
        if (
          this.windTurbineSmallId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.groupSmallB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        // big WT behind big WT  |  |  |  |x|x|
        else if (
          this.windTurbineBigId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigZero,
            this.energyLoss[firstNeighbour][col]
          );
        } else if (
          this.windTurbineSmallId == this.cells[secondNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallOne,
            this.energyLoss[secondNeighbour][col]
          );
        } else if (
          this.windTurbineBigId == this.cells[secondNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigC++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallOne,
            this.energyLoss[secondNeighbour][col]
          );
        }
        // big WT behind small WT  |  |  |x|  |x|
        else if (
          this.windTurbineSmallId == this.cells[secondNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.groupSmallC++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigOne,
            this.energyLoss[secondNeighbour][col]
          );
        }
        // big WT behind big WT  |  |  |x|  |x|
        else if (
          this.windTurbineBigId == this.cells[secondNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigOne,
            this.energyLoss[secondNeighbour][col]
          );
        }
        break;
      case 12:
        if (
          this.windTurbineSmallId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallZero,
            this.energyLoss[firstNeighbour][col]
          );
        } else if (
          this.windTurbineBigId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        // big WT behind small WT  |  |  |  |x|x|
        if (
          this.windTurbineSmallId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.groupSmallB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigZero,
            this.energyLoss[firstNeighbour][col]
          );
        }
        // big WT behind big WT  |  |  |  |x|x|
        else if (
          this.windTurbineBigId == this.cells[firstNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigZero,
            this.energyLoss[firstNeighbour][col]
          );
        } else if (
          this.windTurbineSmallId == this.cells[secondNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallOne,
            this.energyLoss[secondNeighbour][col]
          );
        } else if (
          this.windTurbineBigId == this.cells[secondNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigC++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallOne,
            this.energyLoss[secondNeighbour][col]
          );
        }
        // big WT behind small WT  |  |  |x|  |x|
        else if (
          this.windTurbineSmallId == this.cells[secondNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.groupSmallC++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigOne,
            this.energyLoss[secondNeighbour][col]
          );
        }
        // big WT behind big WT  |  |  |x|  |x|
        else if (
          this.windTurbineBigId == this.cells[secondNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigOne,
            this.energyLoss[secondNeighbour][col]
          );
        } else if (
          this.windTurbineSmallId == this.cells[thirdNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallC++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallTwo,
            this.energyLoss[thirdNeighbour][col]
          );
        } else if (
          this.windTurbineBigId == this.cells[thirdNeighbour][col] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigD++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallTwo,
            this.energyLoss[thirdNeighbour][col]
          );
        }
        // big WT behind small WT  |  |x|  |  |x|
        else if (
          this.windTurbineSmallId == this.cells[thirdNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigTwo,
            this.energyLoss[thirdNeighbour][col]
          );
        }
        // big WT behind big WT  |  |x|  |  |x|
        else if (
          this.windTurbineBigId == this.cells[thirdNeighbour][col] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigC++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigTwo,
            this.energyLoss[thirdNeighbour][col]
          );
        }
        break;
    }
  }

  /**
   * calculates the energy loss of the first four cells in wind direction
   * WEST
   * this might be a bit complicated - maybe there is a solution with a simple if statemnt which checks if j is out of bounds
   * @param {*} j | either the col (east-, west wind) or row (north-, south wind)
   * @param {*} col | the column the looked at cell is in
   * @param {*} row | the row the looked at cell is in
   * @param {*} type | the type of the looked at cell
   * @param {*} firstNeighbour | the col or row number of the first neighbour
   * @param {*} secondNeighbour | the col or row number of the second neighbour
   * @param {*} thirdNeighbour | the col or row number of the third neighbour
   */

  checkFirstFourW(
    j,
    col,
    row,
    type,
    firstNeighbour,
    secondNeighbour,
    thirdNeighbour
  ) {
    switch (j) {
      case 1:
        if (
          this.windTurbineSmallId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallZero,
            this.energyLoss[row][firstNeighbour]
          );
        } else if (
          this.windTurbineBigId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallZero,
            this.energyLoss[row][firstNeighbour]
          );
        }
        // big WT behind small WT  |  |  |  |x|x|
        if (
          this.windTurbineSmallId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.groupSmallB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigZero,
            this.energyLoss[row][firstNeighbour]
          );
        }
        // big WT behind big WT  |  |  |  |x|x|
        else if (
          this.windTurbineBigId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigZero,
            this.energyLoss[row][firstNeighbour]
          );
        }
        break;
      case 2:
        if (
          this.windTurbineSmallId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallZero,
            this.energyLoss[row][firstNeighbour]
          );
        } else if (
          this.windTurbineBigId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallZero,
            this.energyLoss[row][firstNeighbour]
          );
        } // big WT behind small WT  |  |  |  |x|x|
        if (
          this.windTurbineSmallId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.groupSmallB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigZero,
            this.energyLoss[row][firstNeighbour]
          );
        }
        // big WT behind big WT  |  |  |  |x|x|
        else if (
          this.windTurbineBigId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigZero,
            this.energyLoss[row][firstNeighbour]
          );
        } else if (
          this.windTurbineSmallId == this.cells[row][secondNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallOne,
            this.energyLoss[row][secondNeighbour]
          );
        } else if (
          this.windTurbineBigId == this.cells[row][secondNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigC++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallOne,
            this.energyLoss[row][secondNeighbour]
          );
        }
        // big WT behind small WT  |  |  |x|  |x|
        else if (
          this.windTurbineSmallId == this.cells[row][secondNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.groupSmallC++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigOne,
            this.energyLoss[row][secondNeighbour]
          );
        }
        // big WT behind big WT  |  |  |x|  |x|
        else if (
          this.windTurbineBigId == this.cells[row][secondNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigOne,
            this.energyLoss[row][secondNeighbour]
          );
        }
        break;
      case 3:
        if (
          this.windTurbineSmallId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallZero,
            this.energyLoss[row][firstNeighbour]
          );
        } else if (
          this.windTurbineBigId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallZero,
            this.energyLoss[row][firstNeighbour]
          );
        } // big WT behind small WT  |  |  |  |x|x|
        if (
          this.windTurbineSmallId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.groupSmallB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigZero,
            this.energyLoss[row][firstNeighbour]
          );
        }
        // big WT behind big WT  |  |  |  |x|x|
        else if (
          this.windTurbineBigId == this.cells[row][firstNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigA++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigZero,
            this.energyLoss[row][firstNeighbour]
          );
        } else if (
          this.windTurbineSmallId == this.cells[row][secondNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallOne,
            this.energyLoss[row][secondNeighbour]
          );
        } else if (
          this.windTurbineBigId == this.cells[row][secondNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigC++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallOne,
            this.energyLoss[row][secondNeighbour]
          );
        }
        // big WT behind small WT  |  |  |x|  |x|
        else if (
          this.windTurbineSmallId == this.cells[row][secondNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.groupSmallC++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigOne,
            this.energyLoss[row][secondNeighbour]
          );
        }
        // big WT behind big WT  |  |  |x|  |x|
        else if (
          this.windTurbineBigId == this.cells[row][secondNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigB++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigOne,
            this.energyLoss[row][secondNeighbour]
          );
        } else if (
          this.windTurbineSmallId == this.cells[row][thirdNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupSmallC++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallSmallTwo,
            this.energyLoss[row][thirdNeighbour]
          );
        } else if (
          this.windTurbineBigId == this.cells[row][thirdNeighbour] &&
          type == this.windTurbineSmallId
        ) {
          this.groupBigD++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigSmallTwo,
            this.energyLoss[row][thirdNeighbour]
          );
        }
        // big WT behind small WT  |  |x|  |  |x|
        else if (
          this.windTurbineSmallId == this.cells[row][thirdNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.calculateEnergyLoss(
            col,
            row,
            this.elSmallBigTwo,
            this.energyLoss[row][thirdNeighbour]
          );
        }
        // big WT behind big WT  |  |x|  |  |x|
        else if (
          this.windTurbineBigId == this.cells[row][thirdNeighbour] &&
          type == this.windTurbineBigId
        ) {
          this.groupBigD++;
          this.calculateEnergyLoss(
            col,
            row,
            this.elBigBigTwo,
            this.energyLoss[row][thirdNeighbour]
          );
        }
        break;
    }
  }

  /**
   *
   * @param {*} col | the column the looked at cell is in
   * @param {*} row | the row the looked at cell is in
   * @param {*} factor | the factor by which the energy gain is reduced
   * @param {*} neighbour | the energy gain of the next (first second third or fourth)
   *                      | neighbour which is looked at
   */
  calculateEnergyLoss(col, row, factor, neighbour) {
    //if (this.energyLoss[row][col] == 1) {
    this.energyLoss[row][col] = factor * neighbour;
    //} else {
    //    this.energyLoss[row][col] *= neighbour;
    //}
  }
}

module.exports = SlipstreamData;
