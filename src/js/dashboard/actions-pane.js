/*const EventEmitter = require("events");

class ActionsPane {
  constructor(config) {
    this.config = config;
    this.$element = $("<div></div>").addClass("actions-pane");
    this.disabled = false;

    this.buttons = this.config.dashboard.actions.buttons.map((button) =>
      $("<button></button>")
        .attr("type", "button")
        .addClass(`btn btn-block btn-dashboard-action btn-${button.id}`)
        .append(
          $("<span></span>").addClass("text text-de").html(button.text.de)
        )
        .append(
          $("<span></span>").addClass("text text-en").html(button.text.en)
        )
        .attr("id", button.id)
    );

    this.$element.append(
      $("<div></div>")
        .addClass("row justify-content-center align-items-center")
        .append(
          this.buttons.map((button) =>
            $("<div>").addClass("col-5").append(button)
          )
        )
    );
  }

  disableAll() {
    this.disabled = true;
    this.buttons.forEach((button) => button.attr("disabled", true));
    this.buttons.forEach((button) => button.addClass("disabled"));
  }

  enableAll() {
    this.disabled = false;
    this.buttons.forEach((button) => button.attr("disabled", false));
    this.buttons.forEach((button) => button.removeClass("disabled"));
  }
}

module.exports = ActionsPane;
*/
