class IndexView {
  constructor(id, definition) {
    this.id = id;
    this.definition = definition;
    this.value = null;
    this.$valueElement = $("<div></div>").addClass("value");
    this.$element = $("<div></div>")
      .addClass(["index", `index-${this.id}`])
      .append([
        $("<div></div>")
          .addClass("description")
          .append([
            $("<div></div>").addClass("name").text(this.definition.name.de),
            $("<div></div>").addClass("name-tr").text(this.definition.name.en),
          ]),
        this.$valueElement,
      ]);
    console.log(this.$element);
  }

  setValue(value) {
    if (value !== this.value) {
      if (this.value !== null) {
        this.$element.removeClass(`value-${this.value}`);
      }
      this.value = value;
      this.$element.addClass(`value-${this.value}`);
    }
  }
}

module.exports = IndexView;
