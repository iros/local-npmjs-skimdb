window.Utils = {
  computeGrid: function(width, height, numOfUnits) {
    var rows = Math.ceil(Math.sqrt( numOfUnits * (height / width )));
    var cols = Math.ceil(numOfUnits / rows);

    var gridx = Math.floor(width / cols);
    var gridy = Math.floor(height/ rows);

    return {
      cols: cols,
      rows: rows,
      gridx: gridx,
      gridy: gridx
    };
  },

  computeGridUnitSize: function(width, height, unitSize) {
    var rows = Math.ceil(height / unitSize);
    var cols = Math.ceil(width / unitSize);
    return {
      rows: rows,
      cols: cols
    };
  }
};