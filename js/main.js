$(document).ready(function(){
  $("select").material_select();
  graphArea.start();

  $("#create").click(function() {
    clearTimeouts();
    setTimeout(function() {
      graphArea.generateRandomNodes();
      graphArea.drawAll(unvisitedColour);
      graphArea.resetStats();
    }, delay);
  });

  $("#reset").click(function() {
    clearTimeouts();
    setTimeout(function() {
      graphArea.clear();
      graphArea.drawAll(unvisitedColour);
      graphArea.resetStats();
      graphArea.available = true;
    }, delay);
  });

  $("#prims").click(function() { runAlgorithm(prims); });
  $("#kruskals").click(function() { runAlgorithm(kruskals); });
  $("#minimal-matching").click(function() { runAlgorithm(minimalMatching); });
  $("#nearest-neighbour").click(function() { runAlgorithm(nearestNeighbour); });
  $("#random-tour").click(function() { runAlgorithm(randomTour); });
  $("#two-opt").click(function() { runAlgorithm(twoOpt); });
  $("#graham-scan").click(function() { runAlgorithm(grahamScan); });

});

var visitedColour = "#4CAF50";
var unvisitedColour = "#FF8A80";
var checkColour = "#5C6BC0";
var delay = 45;
var graphLoop; //Interval for certain algorithms.


var graphArea = {
  start: function() {
    this.canvas = $("#graph-view")[0];
    this.context = this.canvas.getContext("2d");
    this.context.lineWidth = 2;
    this.nodeSet = [];
    this.nodeSize = 10;
    this.generateRandomNodes();
  },
  clear: function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },
  drawAll: function(colour) {
    for (var i = 0; i < this.nodeSet.length; i++) {
      this.nodeSet[i].update(colour);
    }
  },
  resetStats: function() {
    graphStats.setValue("");
    graphStats.setName("-");
  },
  generateRandomNodes: function() {
    this.clear();
    this.nodeSet = [];
    this.nodeCount = parseInt($("#select-node-count").val());
    for (var i = 0; i < this.nodeCount; i++) {
      var x = Math.floor(Math.random() * (this.canvas.width - this.nodeSize));
      var y = Math.floor(Math.random() * (this.canvas.height - this.nodeSize));
      graphArea.nodeSet.push(new node(x, y, i));
    }
    this.drawAll(unvisitedColour);
    graphStats.setNodeCount(this.nodeCount);
    this.available = true;
  }
};

var graphStats = {
  setValue: function(value) {
    $("#stat-value").html(value);
  },
  incrementValue: function(value) {
    $("#stat-value").html(parseInt($("#stat-value").html()) + value);
  },
  setNodeCount: function(value) {
    $("#node-count").html(value);
  },
  setName: function(name) {
    $("#stat-name").html(name);
  }
};

var timeouts = []; //Contains all timeout IDs that are possibly running for easier clearing.

//Runs a graph algorithm.
function runAlgorithm(algorithm) {
  if (graphArea.available) {
    algorithm();
    window.location = "#top-view";
  }
}

//Clears all active timeouts and intervals.
function clearTimeouts() {
  clearInterval(graphLoop);
  for (var i = 0; i < timeouts.length; i++) {
    clearTimeout(timeouts[i]); //Clears all possibly running timeouts.
  }
  timeouts = []; //Resets timeout array as all timeouts have been cleared.
}

//Draws an edge between two nodes coloured check then visited. Adds the timout to an array so it can be easily cleared upon reset.
function drawVisitedEdge(startNode, endNode, edgeCount) {
  timeouts.push(setTimeout(function() {
    edge(startNode, endNode, checkColour);
  }, delay * edgeCount * 2));

  timeouts.push(setTimeout(function() {
    edge(startNode, endNode, visitedColour);
    graphStats.incrementValue(getDistance(startNode, endNode));
  }, (delay * edgeCount * 2) + delay));
}

//Edge object that connected two distinct nodes in the graph.
function edge(startNode, endNode, colour) {
  var offset = graphArea.nodeSize / 2;
  var ctx = graphArea.context;
  ctx.beginPath();
  ctx.moveTo(startNode.x + offset, startNode.y + offset);
  ctx.lineTo(endNode.x + offset, endNode.y + offset);
  ctx.strokeStyle = colour;
  ctx.stroke();
  startNode.update(colour);
  endNode.update(colour);
}

//Node object containing the position information of a point in the graph.
function node(x, y, id) {
  this.x = x;
  this.y = y;
  this.id = id;
  this.update = function(colour) {
    ctx = graphArea.context;
    ctx.fillStyle = colour;
    ctx.fillRect(this.x, this.y, graphArea.nodeSize, graphArea.nodeSize);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(this.x + 2, this.y + 2, graphArea.nodeSize - 4, graphArea.nodeSize - 4);
  };
}

//Returns the Euclidean distance between two nodes.
function getDistance(startNode, endNode) {
  return Math.floor(Math.sqrt(Math.pow(startNode.x - endNode.x, 2) + Math.pow(startNode.y - endNode.y, 2)));
}

//Performs Prim's algorithm for finding a minimum spanning tree on the graph.
function prims() {
  graphStats.setName("Minimum Spanning Tree Length: ");
  graphStats.setValue(0);
  graphArea.available = false;

  var unvisitedNodes = [];
  var visitedNodes = [];
  var edgeCount = 0;

  for (var k = 0; k < graphArea.nodeCount; k++) {
    unvisitedNodes[k] = graphArea.nodeSet[k];
  }

  //Moves the start node from the unvisited array to the visited array.
  var startNode = unvisitedNodes.splice(0, 1)[0];
  startNode.update(visitedColour);
  visitedNodes.push(startNode);

  while (unvisitedNodes.length > 0) {
    var smallestDistance = Number.POSITIVE_INFINITY;
    var startIndex, endIndex;

    for (var i = 0; i < visitedNodes.length; i++) {
      for (var j = 0; j < unvisitedNodes.length; j++) {
        var tmpDistance = getDistance(visitedNodes[i], unvisitedNodes[j]);
        if (tmpDistance < smallestDistance) {
          smallestDistance = tmpDistance;
          endIndex = j;
          startIndex = i;
        }
      }
    }
    drawVisitedEdge(visitedNodes[startIndex], unvisitedNodes[endIndex], ++edgeCount);
    visitedNodes.push(unvisitedNodes.splice(endIndex, 1)[0]);
  }
}

//Performs Kruskal's algorithm for finding a minimum spanning tree on the graph.
function kruskals() {
  graphStats.setName("Minimum Spanning Tree Length: ");
  graphStats.setValue(0);
  graphArea.available = false;

  var disjointSet = [];
  var edgeCount = 0;

  for (var k = 0; k < graphArea.nodeCount; k++) {
    disjointSet[k] = {set: k, nodes: []};
    graphArea.nodeSet[k].set = k;
    disjointSet[k].nodes.push(graphArea.nodeSet[k]);
  }

  var edgeSet = [];

  //As the graph is undirected, adds only distinct edges to the edge set.
  for (var i = 0; i < graphArea.nodeCount; i++) {
    for (var j = i; j < graphArea.nodeCount; j++) {
      if (i != j) {
        var weight = getDistance(graphArea.nodeSet[i], graphArea.nodeSet[j]);
        edgeSet.push({weight: weight, startNode: graphArea.nodeSet[i], endNode: graphArea.nodeSet[j]});
      }
    }
  }

  //Sorts the edges by weight order.
  edgeSet.sort(function(a, b) {
    return (a.weight < b.weight) ? -1 : (a.weight > b.weight) ? 1 : 0;
  });

  for (var edgeIndex = 0; edgeIndex < edgeSet.length; edgeIndex++) {
    var startSet = edgeSet[edgeIndex].startNode.set;
    startSet = disjointSet[startSet].set;
    var endSet = edgeSet[edgeIndex].endNode.set;
    endSet = disjointSet[endSet].set;

    if (startSet != endSet) {
      drawVisitedEdge(edgeSet[edgeIndex].startNode, edgeSet[edgeIndex].endNode, ++edgeCount);

      for (var setIndex = 0; setIndex < disjointSet[startSet].nodes.length; setIndex++) {
        disjointSet[startSet].nodes[setIndex].set = endSet;
        disjointSet[endSet].nodes.push(disjointSet[startSet].nodes[setIndex]);
      }
      disjointSet[startSet].nodes = null;
    }
  }
}

//Finds a sub-optimal minimal matching.
function minimalMatching() {
  graphStats.setName("Minimal Matching Length: ");
  graphStats.setValue(0);
  graphArea.available = false;

  var disjointSet = [];
  var edgeCount = 0;

  for (var k = 0; k < graphArea.nodeCount; k++) {
    disjointSet[k] = {set: k, nodes: []};
    graphArea.nodeSet[k].set = k;
    disjointSet[k].nodes.push(graphArea.nodeSet[k]);
    graphArea.nodeSet[k].incldued = false;
  }

  var edgeSet = [];

  //As the graph is undirected, adds only distinct edges to the edge set.
  for (var i = 0; i < graphArea.nodeCount; i++) {
    for (var j = i; j < graphArea.nodeCount; j++) {
      if (i != j) {
        var weight = getDistance(graphArea.nodeSet[i], graphArea.nodeSet[j]);
        edgeSet.push({weight: weight, startNode: graphArea.nodeSet[i], endNode: graphArea.nodeSet[j]});
      }
    }
  }

  //Sorts the edges by weight order.
  edgeSet.sort(function(a, b) {
    return (a.weight < b.weight) ? -1 : (a.weight > b.weight) ? 1 : 0;
  });

  for (var edgeIndex = 0; edgeIndex < edgeSet.length; edgeIndex++) {
    var startSet = edgeSet[edgeIndex].startNode.set;
    startSet = disjointSet[startSet].set;
    var endSet = edgeSet[edgeIndex].endNode.set;
    endSet = disjointSet[endSet].set;

    if (!edgeSet[edgeIndex].startNode.included && !edgeSet[edgeIndex].endNode.included) {
      edgeSet[edgeIndex].startNode.included = true;
      edgeSet[edgeIndex].endNode.included = true;
      drawVisitedEdge(edgeSet[edgeIndex].startNode, edgeSet[edgeIndex].endNode, ++edgeCount);

      for (var setIndex = 0; setIndex < disjointSet[startSet].nodes.length; setIndex++) {
        disjointSet[startSet].nodes[setIndex].set = endSet;
        disjointSet[endSet].nodes.push(disjointSet[startSet].nodes[setIndex]);
      }
      disjointSet[startSet].nodes = null;
    }
  }
}

//Performs the Nearest Neighbour algorithm to find a Hamiltonian Path in the graph.
function nearestNeighbour() {
  graphStats.setName("Tour Length: ");
  graphStats.setValue(0);
  graphArea.available = false;

  var unvisitedNodes = []; //Set of all nodes unvisited.
  var visitedNodes = []; //Set of all node visited.

  for (var k = 0; k < graphArea.nodeCount; k++) {
    unvisitedNodes[k] = graphArea.nodeSet[k];
  }

  //Moves the start node from the unvisited array to the visited array.
  var currentNode = unvisitedNodes.splice(0, 1)[0];
  currentNode.update(visitedColour);
  visitedNodes.push(currentNode);
  var endMarker = false;
  var edgeCount = 0;

  while(!endMarker || unvisitedNodes.length > 0) {
    var smallestDistance = Number.POSITIVE_INFINITY;

    for (var i = 0; i < unvisitedNodes.length; i++) {
      var tmpDistance = getDistance(currentNode, unvisitedNodes[i]);
      if (tmpDistance < smallestDistance) {
        smallestDistance = tmpDistance;
        nextIndex = i;
      }
    }

    drawVisitedEdge(currentNode, unvisitedNodes[nextIndex], ++edgeCount);
    currentNode = unvisitedNodes[nextIndex];
    visitedNodes.push(unvisitedNodes.splice(nextIndex, 1)[0]);

    if (unvisitedNodes.length === 0 && !endMarker) {
      unvisitedNodes.push(visitedNodes.splice(0, 1)[0]);
      endMarker = true;
    }
  }
  return visitedNodes; //Returns the tour for 2-opt to optimise it.
}

//Performs the 2-Opt optimisation on an existing tour.
function twoOpt() {
  var tour = nearestNeighbour();
  var tourIteration = 0;
  var newTour = [];
  var newTourLength;

  tour.unshift(tour[tour.length - 1]); //Copies the last element to the first element.
  var tourLength = getTourLength(tour);
  var improvement = false;

  timeouts.push(setTimeout(function() {
    while (!improvement) {
      for (var i = 1; i < tour.length - 2; i++) {
        for (var j = i+1; j < tour.length - 1; j++) {
          newTour = [];

          for (tourIndex = 0; tourIndex < i; tourIndex++) {
            newTour.push(tour[tourIndex]);
          }
          for (tourIndex = j; tourIndex >= i; tourIndex--) {
            newTour.push(tour[tourIndex]);
          }
          for (tourIndex = j+1; tourIndex < tour.length; tourIndex++) {
            newTour.push(tour[tourIndex]);
          }

          newTourLength = getTourLength(newTour);

          if (newTourLength < tourLength) {

            var tourIndex = [];
            for (var l = 0; l < tour.length; l++) {
              tourIndex[l] = tour[l].id;
            }
            drawTwoOpt(tourIndex, i, j, tourLength, ++tourIteration);
            tour = newTour;
            tourLength = newTourLength;
            newTour = [];
            improvement = true;
            break;
          }
          if (improvement) {
            break;
          }
        }
      }
      improvement = !improvement;
    }
    drawTour(tour, tourLength, ++tourIteration);

  }, delay * graphArea.nodeCount * 2));
}

//Draws an iteration of 2-opt onto the canvas.
function drawTwoOpt(tour, pos1, pos2, tourLength, tourIteration) {
  timeouts.push(setTimeout(function() {
    graphArea.clear();
    graphArea.drawAll(visitedColour);
    graphStats.setValue(tourLength);
    for (var tourIndex = 0; tourIndex < tour.length - 1; tourIndex++) {
      if (tourIndex != pos1 && tourIndex != pos2) {
        edge(graphArea.nodeSet[tour[tourIndex]], graphArea.nodeSet[tour[tourIndex+1]], visitedColour);
      }
    }
    edge(graphArea.nodeSet[tour[pos1]], graphArea.nodeSet[tour[pos2+1]], checkColour);
    edge(graphArea.nodeSet[tour[pos1-1]], graphArea.nodeSet[tour[pos2]], checkColour);
  }, delay * tourIteration * 2));
}

//Draws a finalised tour onto the canvas.
function drawTour(tour, tourLength, tourIteration) {
  timeouts.push(setTimeout(function() {
    graphArea.clear();
    graphArea.drawAll(visitedColour);
    graphStats.setValue(tourLength);
    for (var tourIndex = 0; tourIndex < tour.length - 1; tourIndex++) {
      edge(tour[tourIndex], tour[tourIndex+1], visitedColour);
    }
  }, delay * tourIteration * 2));
}

//Returns the euclidean length of a tour.
function getTourLength(tour) {
  var sum = 0;
  for (var i = 0; i < tour.length - 1; i++) {
    sum+= getDistance(tour[i], tour[i+1]);
  }
  return sum;
}

//Performs a random tour to find a inefficient Hamiltonian Path in the graph.
function randomTour() {
  graphStats.setName("Tour Length: ");
  graphStats.setValue(0);
  graphArea.available = false;

  var unvisitedNodes = [];
  var visitedNodes = [];

  for (var i = 0; i < graphArea.nodeCount; i++) {
    unvisitedNodes[i] = graphArea.nodeSet[i];
  }

  //Moves the start node from the unvisited array to the visited array.
  var currentNode = unvisitedNodes.splice(0, 1)[0];
  currentNode.update(visitedColour);
  visitedNodes.push(currentNode);

  var endMarker = false;
  var edgeCount = 0;

  while(!endMarker || unvisitedNodes.length > 0) {
    var randomIndex = Math.floor(Math.random() * unvisitedNodes.length);

    drawVisitedEdge(currentNode, unvisitedNodes[randomIndex], ++edgeCount);
    currentNode = unvisitedNodes[randomIndex];
    visitedNodes.push(unvisitedNodes.splice(randomIndex, 1)[0]);

    if (unvisitedNodes.length === 0 && !endMarker) {
      unvisitedNodes.push(visitedNodes.splice(0, 1)[0]);
      endMarker = true;
    }
  }
  return visitedNodes;
}

//Performs a graham scan to find the convex hull of the graph.
function grahamScan() {
  graphStats.setName("Convex Hull Nodes: ");
  graphStats.setValue(0);
  graphArea.available = false;
  var nodes = [];
  var lowestNodeValue = Number.POSITIVE_INFINITY;
  var lowestNode;

  //Copies all nodes, and finds the node with the smallest y co-ord.
  for (var i = 0; i < graphArea.nodeCount; i++) {
    nodes[i] = graphArea.nodeSet[i];
    if (nodes[i].y < lowestNodeValue) {
      lowestNodeValue = nodes[i].y;
      lowestNodeIndex = i;
    }
  }

  //Swaps the first node with the node with the smallest y co-ord.
  var tmpNode = nodes[lowestNodeIndex];
  nodes[lowestNodeIndex] = nodes[0];
  nodes[0] = tmpNode;

  var arr = [];
  for (i = 0; i < nodes.length; i++) {
    var polarAngle = Math.atan2(nodes[i].y - nodes[0].y, nodes[i].x - nodes[0].x);
    arr.push({node: nodes[i], angle: polarAngle});
  }

  //Sorts the nodes with respect to the polar angle between the lowest point.
  arr.sort(function(a, b) {
    return (a.angle < b.angle) ? -1 : (a.angle > b.angle) ? 1 : 0;
  });

  arr.unshift(arr[arr.length - 1]);

  var m = 1;

  i = 2;
  graphLoop = setInterval(function() {
    if (i < arr.length) {
      while (ccw(arr[m-1].node, arr[m].node, arr[i].node) <= 0) {
        if (m > 1) {
          m--;
          continue;
        }
        else if (i == arr.length) {
          break;
        }
        else {
          i++;
        }
      }
      m++;

      //Swaps elements at position m and i.
      var tmp = arr[m];
      arr[m] = arr[i];
      arr[i] = tmp;

      graphArea.clear();
      graphArea.drawAll(unvisitedColour);
      for (var k = 0; k <= m; k++) {
        arr[k].node.update(visitedColour);
        if (k > 0) {
          if (k == m) {
            edge(arr[k-1].node, arr[k].node, checkColour);
          }
          else {
            edge(arr[k-1].node, arr[k].node, visitedColour);
          }
          arr[k-1].node
        }
        arr[m].node.update(checkColour);
      }
      graphStats.setValue(m);
      if (i == arr.length - 1) {
        edge(arr[0].node, arr[m-1].node, visitedColour);
      }
      i++;
    }
    else {
      clearInterval(graphLoop);
    }
  }, delay * 2);
}

function ccw(p1, p2, p3) {
  return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
}
