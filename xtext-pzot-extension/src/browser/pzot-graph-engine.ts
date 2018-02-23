import * as d3 from  'd3';
import { color, ValueFn, SimulationLinkDatum, Numeric } from 'd3';

import '../../src/browser/style/index.css';
import '../../src/browser/style/vis.min.css';
import cytoscape = require('cytoscape');


class Stack<T> {
    _store: T[] = [];
    push(val: T) {
      this._store.push(val);
    }
    pop(): T | undefined {
      return this._store.pop();
    }
  }

class Node {
    content: string = "";
    children: Array<Node>;

    constructor(input: string) {
        this.children = new Array<Node>();
        this.parse(input);
    }

    // (withinf (&& (dep (next (-p- a)) (-p- b) (-p- c))
    private parse(input: string) {
        let x  = input.substring(2).indexOf('(');
        this.content = input.substring(1, x).replace(' ', '');

        let remaining = input.substring(x, input.length - 1);

        if (input.substring(1, 5).match("/dep/g")) {
            let items = input.substring(1).substring(input.indexOf('(', input.length - 2));


            this.children = new Array<Node>(new Node(remaining));
        } else {
            this.children = new Array<Node>(new Node(remaining));
        }

    }
}

export class PZotGraphEngine {

    protected canvas: HTMLElement ;
    protected graph: any ;
    protected simulation: any ;

    protected  width: number;
    protected  height: number ;
    protected  color: any;

    private link: any;
    private node: any;
    private packLayout: any;
    private loaded: boolean = false;
    private rendered: boolean = false;
    private widget: string = "";
    private operatorRegex = /(?=\()\W\w+|(?=\()\W\W\W/;
    private dependenciesRegex = /(?<=DEPENDENCIES\:)(.*?)(?=\s*FORMULA)/g;

    // Dependency Tree Structure
    private data = {
        "name": "A1",
        "children": [
          {
            "name": "B1",
            "children": [
              {
                "name": "C1",
                "value": 100
              },
              {
                "name": "C2",
                "value": 300
              },
              {
                "name": "C3",
                "value": 200
              }
            ]
          },
          {
            "name": "B2",
            "value": 200
          }
        ]
      }

    private root = d3.hierarchy(this.data);

    constructor() {
        this.color = d3.scaleOrdinal(d3.schemeCategory10);

    }

    private generateCicrle(): void {
        this.packLayout = d3.pack();
        this.packLayout.size([300, 300]);

        this.root.sum(function(d: any) {
            return d.value;
          });

        this.packLayout(this.root);

        d3.select('svg g')
            .selectAll('circle')
            .data(this.root.descendants())
            .enter()
            .append('circle')
            .attr('cx', function(d: any) { return d.x; })
            .attr('cy', function(d: any) { return d.y; })
            .attr('r', function(d: any) { return d.r; })

        let nodes = this.graph
            .selectAll('g')
            .data(this.root.descendants())
            .enter()
            .append('g')
            .attr('transform', function(d: any) {return 'translate(' + [d.x, d.y] + ')'})

        nodes.append('circle')
            .attr('r', function(d: any) { return d.r; })

        nodes.append('text')
            .attr('dy', 4)
            .text(function(d: any) {
              return d.children === undefined ? d.data.name : '';
            })

        this.packLayout.padding(10)
    }

    // private generateTimeline(container: any) {

    //     // create a dataset with items
    //     // we specify the type of the fields `start` and `end` here to be strings
    //     // containing an ISO date. The fields will be outputted as ISO dates
    //     // automatically getting data from the DataSet via items.get().
    //     let items = new vis.DataSet({
    //         type: { start: 'ISODate', end: 'ISODate' }
    //     });

    //     // add items to the DataSet
    //     items.add([
    //         {id: 1, content: 'item 1<br>start', start: '2014-01-23'},
    //         {id: 2, content: 'item 2', start: '2014-01-18'},
    //         {id: 3, content: 'item 3', start: '2014-01-21'},
    //         {id: 4, content: 'item 4', start: '2014-01-19', end: '2014-01-24'},
    //         {id: 5, content: 'item 5', start: '2014-01-28', type: 'point'},
    //         {id: 6, content: 'item 6', start: '2014-01-26'}
    //     ]);

    //     // log changes to the console
    //     items.on('*', function (event, properties) {
    //         console.log(event, properties.items);
    //     });

    //     // let container = document.getElementById('visualization');
    //     let options = {
    //         start: '2014-01-10',
    //         end: '2014-02-10',
    //         height: '100%',

    //         // allow selecting multiple items using ctrl+click, shift+click, or hold.
    //         multiselect: true,

    //         // allow manipulation of items
    //         editable: true,

    //         /* alternatively, enable/disable individual actions:

    //         editable: {
    //         add: true,
    //         updateTime: true,
    //         updateGroup: true,
    //         remove: true
    //         },

    //         */

    //         showCurrentTime: true
    //     };

    //     let timeline = new vis.Timeline(container, items, options);
    // }

    private generateDAG(containter: any) {
        // set up SVG for D3
        let width  = 400;
        let height = 400;
        let colors = d3.schemeCategory10;

        let svg = containter
        .append('svg')
        .attr('oncontextmenu', 'return false;')
        .attr('width', width)
        .attr('height', height);

        // set up initial nodes and links
        //  - nodes are known by 'id', not by index in array.
        //  - reflexive edges are indicated on the node (as a bold black circle).
        //  - links are always source < target; edge directions are set by 'left' and 'right'.
        let nodes = [
            {id: 0, reflexive: false},
            {id: 1, reflexive: true },
            {id: 2, reflexive: false}
        ],
        lastNodeId = 2,
        links = [
        {source: nodes[0], target: nodes[1], left: false, right: true },
        {source: nodes[1], target: nodes[2], left: false, right: true }
        ];

        // init D3 force layout
        let force = d3.forceSimulation()
        .nodes(nodes)
        //.force("link", d3.forceLink(links).distance(200))
        //.links(links)
        //.size([width, height])
        //.linkDistance(150)
        //.charge(-500)
        .on('tick', tick)

        // define arrow markers for graph links
        svg.append('svg:defs').append('svg:marker')
        .attr('id', 'end-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 6)
        .attr('markerWidth', 3)
        .attr('markerHeight', 3)
        .attr('orient', 'auto')
        .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#000');

        svg.append('svg:defs').append('svg:marker')
        .attr('id', 'start-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 4)
        .attr('markerWidth', 3)
        .attr('markerHeight', 3)
        .attr('orient', 'auto')
        .append('svg:path')
        .attr('d', 'M10,-5L0,0L10,5')
        .attr('fill', '#000');

        // line displayed when dragging new nodes
        let drag_line = svg.append('svg:path')
        .attr('class', 'link dragline hidden')
        .attr('d', 'M0,0L0,0');

        // handles to link and node element groups
        let path = svg.append('svg:g').selectAll('path');
        let circle = svg.append('svg:g').selectAll('g');

        // mouse event vars
        let selected_node: any = null;
        let selected_link: any = null;
        let mousedown_link: any = null;
        let mousedown_node: any = null;
        let mouseup_node: any = null;

        function resetMouseVars() {
            mousedown_node = null;
            mouseup_node = null;
            mousedown_link = null;
        }

        // update force layout (called automatically each iteration)
        function tick() {
            // draw directed edges with proper padding from node centers
            path.attr('d', function(d: any) {
            let deltaX = d.target.x - d.source.x,
                deltaY = d.target.y - d.source.y,
                dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
                normX = deltaX / dist,
                normY = deltaY / dist,
                sourcePadding = d.left ? 17 : 12,
                targetPadding = d.right ? 17 : 12,
                sourceX = d.source.x + (sourcePadding * normX),
                sourceY = d.source.y + (sourcePadding * normY),
                targetX = d.target.x - (targetPadding * normX),
                targetY = d.target.y - (targetPadding * normY);
            return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
            });

            circle.attr('transform', function(d: any) {
            return 'translate(' + d.x + ',' + d.y + ')';
            });
        }

        // update graph (called when needed)
        function restart() {
            // path (link) group
            path = path.data(links);

            // update existing links
            path.classed('selected', function(d: any) { return d === selected_link; })
            .style('marker-start', function(d: any) { return d.left ? 'url(#start-arrow)' : ''; })
            .style('marker-end', function(d: any) { return d.right ? 'url(#end-arrow)' : ''; });


            // add new links
            path.enter().append('svg:path')
            .attr('class', 'link')
            .classed('selected', function(d: any) { return d === selected_link; })
            .style('marker-start', function(d: any) { return d.left ? 'url(#start-arrow)' : ''; })
            .style('marker-end', function(d: any) { return d.right ? 'url(#end-arrow)' : ''; })
            .on('mousedown', function(d: any) {
            if(d3.event.ctrlKey) { return; }

            // select link
            mousedown_link = d;
            if (mousedown_link === selected_link) { selected_link = null; } else { selected_link = mousedown_link; }
            selected_node = null;
            restart();
        });

        // remove old links
        path.exit().remove();


        // circle (node) group
        // NB: the function arg is crucial here! nodes are known by id, not by index!
        circle = circle.data(nodes, function(d: any) { return d.id; });

        // update existing nodes (reflexive & selected visual states)
        circle.selectAll('circle')
        .style('fill', function(d: any) { return (d === selected_node) ? d3.rgb(colors[d.id]).brighter().toString() : colors[d.id]; })
        .classed('reflexive', function(d: any) { return d.reflexive; });

        // add new nodes
        let g = circle.enter().append('svg:g');

        g.append('svg:circle')
        .attr('class', 'node')
        .attr('r', 12)
        .style('fill', function(d: any) { return (d === selected_node) ? d3.rgb(colors[d.id]).brighter().toString() : colors[d.id]; })
        .style('stroke', function(d: any) { return d3.rgb(colors[d.id]).darker().toString(); })
        .classed('reflexive', function(d: any) { return d.reflexive; })
        .on('mouseover', function(d: any) {
        if (!mousedown_node || d === mousedown_node) { return; }
        // enlarge target node
        d3.select(containter).attr('transform', 'scale(1.1)');
        })
        .on('mouseout', function(d: any) {
        if(!mousedown_node || d === mousedown_node) { return; }
        // unenlarge target node
        d3.select(containter).attr('transform', '');
        })
        .on('mousedown', function(d: any) {
        if (d3.event.ctrlKey) { return; }

        // select node
        mousedown_node = d;
        if (mousedown_node === selected_node) { selected_node = null; }
        else { selected_node = mousedown_node; }
        selected_link = null;

        // reposition drag line
        drag_line
            .style('marker-end', 'url(#end-arrow)')
            .classed('hidden', false)
            .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);

        restart();
        })
        .on('mouseup', function(d: any) {
        if (!mousedown_node) { return; }

        // needed by FF
        drag_line
            .classed('hidden', true)
            .style('marker-end', '');

        // check for drag-to-self
        mouseup_node = d;
        if (mouseup_node === mousedown_node) { resetMouseVars(); return; }

        // unenlarge target node
        d3.select(containter).attr('transform', '');

        // add link to graph (update if exists)
        // NB: links are strictly source < target; arrows separately specified by booleans
        let source: any, target: any, direction;
        if(mousedown_node.id < mouseup_node.id) {
            source = mousedown_node;
            target = mouseup_node;
            direction = 'right';
        } else {
            source = mouseup_node;
            target = mousedown_node;
            direction = 'left';
        }

        let link: any;
        link = links.filter(function(l) {
            return (l.source === source && l.target === target);
        })[0];

        if (link) {
            link[direction] = true;
        } else {
            link = {source: source, target: target, left: false, right: false};
            link[direction] = true;
            links.push(link);
        }

        // select new link
        selected_link = link;
        selected_node = null;
        restart();
        });

        // show node IDs
        g.append('svg:text')
        .attr('x', 0)
        .attr('y', 4)
        .attr('class', 'id')
        .text(function(d: any) { return d.id; });

        // remove old nodes
        circle.exit().remove();

        // // set the graph in motion
        // force.start();
        // }

        function mousedown() {
        // prevent I-bar on drag
        // d3.event.preventDefault();

        // because :active only works in WebKit?
        svg.classed('active', true);

        if (d3.event.ctrlKey || mousedown_node || mousedown_link) { return; }

        // insert new node at point
        let point = d3.mouse(containter),
        node: any = {id: ++lastNodeId, reflexive: false};
        node.x = point[0];
        node.y = point[1];
        nodes.push(node);

        restart();
        }

        function mousemove() {
        if(!mousedown_node) { return; }

        // update drag line
        drag_line.attr('d', 'M' + mousedown_node.x + ',' +
        mousedown_node.y + 'L' + d3.mouse(containter)[0] + ',' +
        d3.mouse(containter)[1]);

        restart();
        }

        function mouseup() {
            if (mousedown_node) {
            // hide drag line
            drag_line
            .classed('hidden', true)
            .style('marker-end', '');
            }

            // because :active only works in WebKit?
            svg.classed('active', false);

            // clear mouse event vars
            resetMouseVars();
        }

        function spliceLinksForNode(node: any) {
            let toSplice = links.filter(function(l) {
            return (l.source === node || l.target === node);
            });
            toSplice.map(function(l) {
            links.splice(links.indexOf(l), 1);
            });
            }

            // only respond once per keydown
            let lastKeyDown = -1;

            function keydown() {
            d3.event.preventDefault();

            if (lastKeyDown !== -1) { return; }
            lastKeyDown = d3.event.keyCode;

            // // ctrl
            // if (d3.event.keyCode === 17) {
            // circle.call(force.drag);
            // svg.classed('ctrl', true);
            // }

            if (!selected_node && !selected_link) { return; }
            switch (d3.event.keyCode) {
            case 8: // backspace
            case 46: // delete
            if (selected_node) {
                nodes.splice(nodes.indexOf(selected_node), 1);
                spliceLinksForNode(selected_node);
            } else if (selected_link) {
                links.splice(links.indexOf(selected_link), 1);
            }
            selected_link = null;
            selected_node = null;
            restart();
            break;
            case 66: // B
            if (selected_link) {
                // set link direction to both left and right
                selected_link.left = true;
                selected_link.right = true;
            }
            restart();
            break;
            case 76: // L
            if (selected_link) {
                // set link direction to left only
                selected_link.left = true;
                selected_link.right = false;
            }
            restart();
            break;
            case 82: // R
            if (selected_node) {
                // toggle node reflexivity
                selected_node.reflexive = !selected_node.reflexive;
            } else if (selected_link) {
                // set link direction to right only
                selected_link.left = false;
                selected_link.right = true;
            }
            restart();
            break;
            }
        }

        function keyup() {
            lastKeyDown = -1;

            // ctrl
            if (d3.event.keyCode === 17) {
            circle
            .on('mousedown.drag', null)
            .on('touchstart.drag', null);
            svg.classed('ctrl', false);
            }
            }

            // app starts here
            svg.on('mousedown', mousedown)
            .on('mousemove', mousemove)
            .on('mouseup', mouseup);
            d3.select(window)
            .on('keydown', keydown)
            .on('keyup', keyup);
            restart();
        }
    } 

    private ticked(link: any, node: any): any {
        link
            .attr("x1", function(d: any) {
                console.log("x1 - " + d.source.x);
                return d.source.x;
            })
            .attr("y1", function(d: any) {
                console.log("y1 - " + d.source.y);
                return d.source.y;
            })
            .attr("x2", function(d: any) {
                console.log("x2 - " + d.target.x);
                return d.target.x;
            })
            .attr("y2", function(d: any) {
                console.log("y2 - " + d.source.y);
                return d.source.y;
            });

        node
            .attr("cx", function(d: any) {
                console.log("cx - " + d.x);
                return d.x;
            })
            .attr("cy", function(d: any) {
                console.log("cy - " + d.y)
                return d.y;
            });

        console.log("ciaone - tic ");
    }

    private generateGraph(container: any) {

        // set up SVG for D3
        let width  = 800;
        let height = 800;

        let svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);

        let color = d3.scaleOrdinal(d3.schemeCategory10);

        let simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(function(d: any) { return d.id; }))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width, height));

        let graph = {
            "nodes": [
              {"id": "Myriel", "group": 1},
              {"id": "Napoleon", "group": 1},
              {"id": "Mlle.Baptistine", "group": 1},
              {"id": "Mme.Magloire", "group": 1},
              {"id": "CountessdeLo", "group": 1},
              {"id": "Geborand", "group": 1},
              {"id": "Champtercier", "group": 1},
              {"id": "Cravatte", "group": 1},
              {"id": "Count", "group": 1},
              {"id": "OldMan", "group": 1},
              {"id": "Labarre", "group": 2},
              {"id": "Valjean", "group": 2},
              {"id": "Marguerite", "group": 3},
              {"id": "Mme.deR", "group": 2},
              {"id": "Isabeau", "group": 2},
              {"id": "Gervais", "group": 2},
              {"id": "Tholomyes", "group": 3},
              {"id": "Listolier", "group": 3},
              {"id": "Fameuil", "group": 3},
              {"id": "Blacheville", "group": 3},
              {"id": "Favourite", "group": 3},
              {"id": "Dahlia", "group": 3},
              {"id": "Zephine", "group": 3},
              {"id": "Fantine", "group": 3},
              {"id": "Mme.Thenardier", "group": 4},
              {"id": "Thenardier", "group": 4},
              {"id": "Cosette", "group": 5},
              {"id": "Javert", "group": 4},
              {"id": "Fauchelevent", "group": 0},
              {"id": "Bamatabois", "group": 2},
              {"id": "Perpetue", "group": 3},
              {"id": "Simplice", "group": 2},
              {"id": "Scaufflaire", "group": 2},
              {"id": "Woman1", "group": 2},
              {"id": "Judge", "group": 2},
              {"id": "Champmathieu", "group": 2},
              {"id": "Brevet", "group": 2},
              {"id": "Chenildieu", "group": 2},
              {"id": "Cochepaille", "group": 2},
              {"id": "Pontmercy", "group": 4},
              {"id": "Boulatruelle", "group": 6},
              {"id": "Eponine", "group": 4},
              {"id": "Anzelma", "group": 4},
              {"id": "Woman2", "group": 5},
              {"id": "MotherInnocent", "group": 0},
              {"id": "Gribier", "group": 0},
              {"id": "Jondrette", "group": 7},
              {"id": "Mme.Burgon", "group": 7},
              {"id": "Gavroche", "group": 8},
              {"id": "Gillenormand", "group": 5},
              {"id": "Magnon", "group": 5},
              {"id": "Mlle.Gillenormand", "group": 5},
              {"id": "Mme.Pontmercy", "group": 5},
              {"id": "Mlle.Vaubois", "group": 5},
              {"id": "Lt.Gillenormand", "group": 5},
              {"id": "Marius", "group": 8},
              {"id": "BaronessT", "group": 5},
              {"id": "Mabeuf", "group": 8},
              {"id": "Enjolras", "group": 8},
              {"id": "Combeferre", "group": 8},
              {"id": "Prouvaire", "group": 8},
              {"id": "Feuilly", "group": 8},
              {"id": "Courfeyrac", "group": 8},
              {"id": "Bahorel", "group": 8},
              {"id": "Bossuet", "group": 8},
              {"id": "Joly", "group": 8},
              {"id": "Grantaire", "group": 8},
              {"id": "MotherPlutarch", "group": 9},
              {"id": "Gueulemer", "group": 4},
              {"id": "Babet", "group": 4},
              {"id": "Claquesous", "group": 4},
              {"id": "Montparnasse", "group": 4},
              {"id": "Toussaint", "group": 5},
              {"id": "Child1", "group": 10},
              {"id": "Child2", "group": 10},
              {"id": "Brujon", "group": 4},
              {"id": "Mme.Hucheloup", "group": 8}
            ],
            "links": [
              {"source": "Napoleon", "target": "Myriel", "value": 1},
              {"source": "Mlle.Baptistine", "target": "Myriel", "value": 8},
              {"source": "Mme.Magloire", "target": "Myriel", "value": 10},
              {"source": "Mme.Magloire", "target": "Mlle.Baptistine", "value": 6},
              {"source": "CountessdeLo", "target": "Myriel", "value": 1},
              {"source": "Geborand", "target": "Myriel", "value": 1},
              {"source": "Champtercier", "target": "Myriel", "value": 1},
              {"source": "Cravatte", "target": "Myriel", "value": 1},
              {"source": "Count", "target": "Myriel", "value": 2},
              {"source": "OldMan", "target": "Myriel", "value": 1},
              {"source": "Valjean", "target": "Labarre", "value": 1},
              {"source": "Valjean", "target": "Mme.Magloire", "value": 3},
              {"source": "Valjean", "target": "Mlle.Baptistine", "value": 3},
              {"source": "Valjean", "target": "Myriel", "value": 5},
              {"source": "Marguerite", "target": "Valjean", "value": 1},
              {"source": "Mme.deR", "target": "Valjean", "value": 1},
              {"source": "Isabeau", "target": "Valjean", "value": 1},
              {"source": "Gervais", "target": "Valjean", "value": 1},
              {"source": "Listolier", "target": "Tholomyes", "value": 4},
              {"source": "Fameuil", "target": "Tholomyes", "value": 4},
              {"source": "Fameuil", "target": "Listolier", "value": 4},
              {"source": "Blacheville", "target": "Tholomyes", "value": 4},
              {"source": "Blacheville", "target": "Listolier", "value": 4},
              {"source": "Blacheville", "target": "Fameuil", "value": 4},
              {"source": "Favourite", "target": "Tholomyes", "value": 3},
              {"source": "Favourite", "target": "Listolier", "value": 3},
              {"source": "Favourite", "target": "Fameuil", "value": 3},
              {"source": "Favourite", "target": "Blacheville", "value": 4},
              {"source": "Dahlia", "target": "Tholomyes", "value": 3},
              {"source": "Dahlia", "target": "Listolier", "value": 3},
              {"source": "Dahlia", "target": "Fameuil", "value": 3},
              {"source": "Dahlia", "target": "Blacheville", "value": 3},
              {"source": "Dahlia", "target": "Favourite", "value": 5},
              {"source": "Zephine", "target": "Tholomyes", "value": 3},
              {"source": "Zephine", "target": "Listolier", "value": 3},
              {"source": "Zephine", "target": "Fameuil", "value": 3},
              {"source": "Zephine", "target": "Blacheville", "value": 3},
              {"source": "Zephine", "target": "Favourite", "value": 4},
              {"source": "Zephine", "target": "Dahlia", "value": 4},
              {"source": "Fantine", "target": "Tholomyes", "value": 3},
              {"source": "Fantine", "target": "Listolier", "value": 3},
              {"source": "Fantine", "target": "Fameuil", "value": 3},
              {"source": "Fantine", "target": "Blacheville", "value": 3},
              {"source": "Fantine", "target": "Favourite", "value": 4},
              {"source": "Fantine", "target": "Dahlia", "value": 4},
              {"source": "Fantine", "target": "Zephine", "value": 4},
              {"source": "Fantine", "target": "Marguerite", "value": 2},
              {"source": "Fantine", "target": "Valjean", "value": 9},
              {"source": "Mme.Thenardier", "target": "Fantine", "value": 2},
              {"source": "Mme.Thenardier", "target": "Valjean", "value": 7},
              {"source": "Thenardier", "target": "Mme.Thenardier", "value": 13},
              {"source": "Thenardier", "target": "Fantine", "value": 1},
              {"source": "Thenardier", "target": "Valjean", "value": 12},
              {"source": "Cosette", "target": "Mme.Thenardier", "value": 4},
              {"source": "Cosette", "target": "Valjean", "value": 31},
              {"source": "Cosette", "target": "Tholomyes", "value": 1},
              {"source": "Cosette", "target": "Thenardier", "value": 1},
              {"source": "Javert", "target": "Valjean", "value": 17},
              {"source": "Javert", "target": "Fantine", "value": 5},
              {"source": "Javert", "target": "Thenardier", "value": 5},
              {"source": "Javert", "target": "Mme.Thenardier", "value": 1},
              {"source": "Javert", "target": "Cosette", "value": 1},
              {"source": "Fauchelevent", "target": "Valjean", "value": 8},
              {"source": "Fauchelevent", "target": "Javert", "value": 1},
              {"source": "Bamatabois", "target": "Fantine", "value": 1},
              {"source": "Bamatabois", "target": "Javert", "value": 1},
              {"source": "Bamatabois", "target": "Valjean", "value": 2},
              {"source": "Perpetue", "target": "Fantine", "value": 1},
              {"source": "Simplice", "target": "Perpetue", "value": 2},
              {"source": "Simplice", "target": "Valjean", "value": 3},
              {"source": "Simplice", "target": "Fantine", "value": 2},
              {"source": "Simplice", "target": "Javert", "value": 1},
              {"source": "Scaufflaire", "target": "Valjean", "value": 1},
              {"source": "Woman1", "target": "Valjean", "value": 2},
              {"source": "Woman1", "target": "Javert", "value": 1},
              {"source": "Judge", "target": "Valjean", "value": 3},
              {"source": "Judge", "target": "Bamatabois", "value": 2},
              {"source": "Champmathieu", "target": "Valjean", "value": 3},
              {"source": "Champmathieu", "target": "Judge", "value": 3},
              {"source": "Champmathieu", "target": "Bamatabois", "value": 2},
              {"source": "Brevet", "target": "Judge", "value": 2},
              {"source": "Brevet", "target": "Champmathieu", "value": 2},
              {"source": "Brevet", "target": "Valjean", "value": 2},
              {"source": "Brevet", "target": "Bamatabois", "value": 1},
              {"source": "Chenildieu", "target": "Judge", "value": 2},
              {"source": "Chenildieu", "target": "Champmathieu", "value": 2},
              {"source": "Chenildieu", "target": "Brevet", "value": 2},
              {"source": "Chenildieu", "target": "Valjean", "value": 2},
              {"source": "Chenildieu", "target": "Bamatabois", "value": 1},
              {"source": "Cochepaille", "target": "Judge", "value": 2},
              {"source": "Cochepaille", "target": "Champmathieu", "value": 2},
              {"source": "Cochepaille", "target": "Brevet", "value": 2},
              {"source": "Cochepaille", "target": "Chenildieu", "value": 2},
              {"source": "Cochepaille", "target": "Valjean", "value": 2},
              {"source": "Cochepaille", "target": "Bamatabois", "value": 1},
              {"source": "Pontmercy", "target": "Thenardier", "value": 1},
              {"source": "Boulatruelle", "target": "Thenardier", "value": 1},
              {"source": "Eponine", "target": "Mme.Thenardier", "value": 2},
              {"source": "Eponine", "target": "Thenardier", "value": 3},
              {"source": "Anzelma", "target": "Eponine", "value": 2},
              {"source": "Anzelma", "target": "Thenardier", "value": 2},
              {"source": "Anzelma", "target": "Mme.Thenardier", "value": 1},
              {"source": "Woman2", "target": "Valjean", "value": 3},
              {"source": "Woman2", "target": "Cosette", "value": 1},
              {"source": "Woman2", "target": "Javert", "value": 1},
              {"source": "MotherInnocent", "target": "Fauchelevent", "value": 3},
              {"source": "MotherInnocent", "target": "Valjean", "value": 1},
              {"source": "Gribier", "target": "Fauchelevent", "value": 2},
              {"source": "Mme.Burgon", "target": "Jondrette", "value": 1},
              {"source": "Gavroche", "target": "Mme.Burgon", "value": 2},
              {"source": "Gavroche", "target": "Thenardier", "value": 1},
              {"source": "Gavroche", "target": "Javert", "value": 1},
              {"source": "Gavroche", "target": "Valjean", "value": 1},
              {"source": "Gillenormand", "target": "Cosette", "value": 3},
              {"source": "Gillenormand", "target": "Valjean", "value": 2},
              {"source": "Magnon", "target": "Gillenormand", "value": 1},
              {"source": "Magnon", "target": "Mme.Thenardier", "value": 1},
              {"source": "Mlle.Gillenormand", "target": "Gillenormand", "value": 9},
              {"source": "Mlle.Gillenormand", "target": "Cosette", "value": 2},
              {"source": "Mlle.Gillenormand", "target": "Valjean", "value": 2},
              {"source": "Mme.Pontmercy", "target": "Mlle.Gillenormand", "value": 1},
              {"source": "Mme.Pontmercy", "target": "Pontmercy", "value": 1},
              {"source": "Mlle.Vaubois", "target": "Mlle.Gillenormand", "value": 1},
              {"source": "Lt.Gillenormand", "target": "Mlle.Gillenormand", "value": 2},
              {"source": "Lt.Gillenormand", "target": "Gillenormand", "value": 1},
              {"source": "Lt.Gillenormand", "target": "Cosette", "value": 1},
              {"source": "Marius", "target": "Mlle.Gillenormand", "value": 6},
              {"source": "Marius", "target": "Gillenormand", "value": 12},
              {"source": "Marius", "target": "Pontmercy", "value": 1},
              {"source": "Marius", "target": "Lt.Gillenormand", "value": 1},
              {"source": "Marius", "target": "Cosette", "value": 21},
              {"source": "Marius", "target": "Valjean", "value": 19},
              {"source": "Marius", "target": "Tholomyes", "value": 1},
              {"source": "Marius", "target": "Thenardier", "value": 2},
              {"source": "Marius", "target": "Eponine", "value": 5},
              {"source": "Marius", "target": "Gavroche", "value": 4},
              {"source": "BaronessT", "target": "Gillenormand", "value": 1},
              {"source": "BaronessT", "target": "Marius", "value": 1},
              {"source": "Mabeuf", "target": "Marius", "value": 1},
              {"source": "Mabeuf", "target": "Eponine", "value": 1},
              {"source": "Mabeuf", "target": "Gavroche", "value": 1},
              {"source": "Enjolras", "target": "Marius", "value": 7},
              {"source": "Enjolras", "target": "Gavroche", "value": 7},
              {"source": "Enjolras", "target": "Javert", "value": 6},
              {"source": "Enjolras", "target": "Mabeuf", "value": 1},
              {"source": "Enjolras", "target": "Valjean", "value": 4},
              {"source": "Combeferre", "target": "Enjolras", "value": 15},
              {"source": "Combeferre", "target": "Marius", "value": 5},
              {"source": "Combeferre", "target": "Gavroche", "value": 6},
              {"source": "Combeferre", "target": "Mabeuf", "value": 2},
              {"source": "Prouvaire", "target": "Gavroche", "value": 1},
              {"source": "Prouvaire", "target": "Enjolras", "value": 4},
              {"source": "Prouvaire", "target": "Combeferre", "value": 2},
              {"source": "Feuilly", "target": "Gavroche", "value": 2},
              {"source": "Feuilly", "target": "Enjolras", "value": 6},
              {"source": "Feuilly", "target": "Prouvaire", "value": 2},
              {"source": "Feuilly", "target": "Combeferre", "value": 5},
              {"source": "Feuilly", "target": "Mabeuf", "value": 1},
              {"source": "Feuilly", "target": "Marius", "value": 1},
              {"source": "Courfeyrac", "target": "Marius", "value": 9},
              {"source": "Courfeyrac", "target": "Enjolras", "value": 17},
              {"source": "Courfeyrac", "target": "Combeferre", "value": 13},
              {"source": "Courfeyrac", "target": "Gavroche", "value": 7},
              {"source": "Courfeyrac", "target": "Mabeuf", "value": 2},
              {"source": "Courfeyrac", "target": "Eponine", "value": 1},
              {"source": "Courfeyrac", "target": "Feuilly", "value": 6},
              {"source": "Courfeyrac", "target": "Prouvaire", "value": 3},
              {"source": "Bahorel", "target": "Combeferre", "value": 5},
              {"source": "Bahorel", "target": "Gavroche", "value": 5},
              {"source": "Bahorel", "target": "Courfeyrac", "value": 6},
              {"source": "Bahorel", "target": "Mabeuf", "value": 2},
              {"source": "Bahorel", "target": "Enjolras", "value": 4},
              {"source": "Bahorel", "target": "Feuilly", "value": 3},
              {"source": "Bahorel", "target": "Prouvaire", "value": 2},
              {"source": "Bahorel", "target": "Marius", "value": 1},
              {"source": "Bossuet", "target": "Marius", "value": 5},
              {"source": "Bossuet", "target": "Courfeyrac", "value": 12},
              {"source": "Bossuet", "target": "Gavroche", "value": 5},
              {"source": "Bossuet", "target": "Bahorel", "value": 4},
              {"source": "Bossuet", "target": "Enjolras", "value": 10},
              {"source": "Bossuet", "target": "Feuilly", "value": 6},
              {"source": "Bossuet", "target": "Prouvaire", "value": 2},
              {"source": "Bossuet", "target": "Combeferre", "value": 9},
              {"source": "Bossuet", "target": "Mabeuf", "value": 1},
              {"source": "Bossuet", "target": "Valjean", "value": 1},
              {"source": "Joly", "target": "Bahorel", "value": 5},
              {"source": "Joly", "target": "Bossuet", "value": 7},
              {"source": "Joly", "target": "Gavroche", "value": 3},
              {"source": "Joly", "target": "Courfeyrac", "value": 5},
              {"source": "Joly", "target": "Enjolras", "value": 5},
              {"source": "Joly", "target": "Feuilly", "value": 5},
              {"source": "Joly", "target": "Prouvaire", "value": 2},
              {"source": "Joly", "target": "Combeferre", "value": 5},
              {"source": "Joly", "target": "Mabeuf", "value": 1},
              {"source": "Joly", "target": "Marius", "value": 2},
              {"source": "Grantaire", "target": "Bossuet", "value": 3},
              {"source": "Grantaire", "target": "Enjolras", "value": 3},
              {"source": "Grantaire", "target": "Combeferre", "value": 1},
              {"source": "Grantaire", "target": "Courfeyrac", "value": 2},
              {"source": "Grantaire", "target": "Joly", "value": 2},
              {"source": "Grantaire", "target": "Gavroche", "value": 1},
              {"source": "Grantaire", "target": "Bahorel", "value": 1},
              {"source": "Grantaire", "target": "Feuilly", "value": 1},
              {"source": "Grantaire", "target": "Prouvaire", "value": 1},
              {"source": "MotherPlutarch", "target": "Mabeuf", "value": 3},
              {"source": "Gueulemer", "target": "Thenardier", "value": 5},
              {"source": "Gueulemer", "target": "Valjean", "value": 1},
              {"source": "Gueulemer", "target": "Mme.Thenardier", "value": 1},
              {"source": "Gueulemer", "target": "Javert", "value": 1},
              {"source": "Gueulemer", "target": "Gavroche", "value": 1},
              {"source": "Gueulemer", "target": "Eponine", "value": 1},
              {"source": "Babet", "target": "Thenardier", "value": 6},
              {"source": "Babet", "target": "Gueulemer", "value": 6},
              {"source": "Babet", "target": "Valjean", "value": 1},
              {"source": "Babet", "target": "Mme.Thenardier", "value": 1},
              {"source": "Babet", "target": "Javert", "value": 2},
              {"source": "Babet", "target": "Gavroche", "value": 1},
              {"source": "Babet", "target": "Eponine", "value": 1},
              {"source": "Claquesous", "target": "Thenardier", "value": 4},
              {"source": "Claquesous", "target": "Babet", "value": 4},
              {"source": "Claquesous", "target": "Gueulemer", "value": 4},
              {"source": "Claquesous", "target": "Valjean", "value": 1},
              {"source": "Claquesous", "target": "Mme.Thenardier", "value": 1},
              {"source": "Claquesous", "target": "Javert", "value": 1},
              {"source": "Claquesous", "target": "Eponine", "value": 1},
              {"source": "Claquesous", "target": "Enjolras", "value": 1},
              {"source": "Montparnasse", "target": "Javert", "value": 1},
              {"source": "Montparnasse", "target": "Babet", "value": 2},
              {"source": "Montparnasse", "target": "Gueulemer", "value": 2},
              {"source": "Montparnasse", "target": "Claquesous", "value": 2},
              {"source": "Montparnasse", "target": "Valjean", "value": 1},
              {"source": "Montparnasse", "target": "Gavroche", "value": 1},
              {"source": "Montparnasse", "target": "Eponine", "value": 1},
              {"source": "Montparnasse", "target": "Thenardier", "value": 1},
              {"source": "Toussaint", "target": "Cosette", "value": 2},
              {"source": "Toussaint", "target": "Javert", "value": 1},
              {"source": "Toussaint", "target": "Valjean", "value": 1},
              {"source": "Child1", "target": "Gavroche", "value": 2},
              {"source": "Child2", "target": "Gavroche", "value": 2},
              {"source": "Child2", "target": "Child1", "value": 3},
              {"source": "Brujon", "target": "Babet", "value": 3},
              {"source": "Brujon", "target": "Gueulemer", "value": 3},
              {"source": "Brujon", "target": "Thenardier", "value": 3},
              {"source": "Brujon", "target": "Gavroche", "value": 1},
              {"source": "Brujon", "target": "Eponine", "value": 1},
              {"source": "Brujon", "target": "Claquesous", "value": 1},
              {"source": "Brujon", "target": "Montparnasse", "value": 1},
              {"source": "Mme.Hucheloup", "target": "Bossuet", "value": 1},
              {"source": "Mme.Hucheloup", "target": "Joly", "value": 1},
              {"source": "Mme.Hucheloup", "target": "Grantaire", "value": 1},
              {"source": "Mme.Hucheloup", "target": "Bahorel", "value": 1},
              {"source": "Mme.Hucheloup", "target": "Courfeyrac", "value": 1},
              {"source": "Mme.Hucheloup", "target": "Gavroche", "value": 1},
              {"source": "Mme.Hucheloup", "target": "Enjolras", "value": 1}
            ]
          };

        
        
        let link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(graph.links)
            .enter().append("line")
            .attr("stroke-width", function(d: any) { return Math.sqrt(d.value); });

        let node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(graph.nodes)
            .enter().append("circle")
            .attr("r", 15)
            .attr("cx", width / 2)
            .attr("cy", height / 2)
            .attr("fill", function(d: any) { return color(d.group); })
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        node.append("title")
            .text(function(d: any) { return d.id; });

        simulation
            .nodes(graph.nodes)
            .on("tick", this.ticked(link, node));

        if (simulation !== undefined) {
            let link: any = simulation.force("link");
            link.links(graph.links);
        }

        function dragstarted(d: any) {
            console.log("Drag!");
            if (!d3.event.active) { simulation.alphaTarget(0.3).restart(); }
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d: any) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d: any) {
            if (!d3.event.active) { simulation.alphaTarget(0); }
            d.fx = null;
            d.fy = null;
        }

       
    }

    private Darcula() {
        let Dracula = require('graphdracula')

        let Graph = Dracula.Graph
        let Renderer = Dracula.Renderer.Raphael
        let Layout = Dracula.Layout.Spring

        let graph = new Graph()

        graph.addEdge('Banana', 'Apple')
        graph.addEdge('Apple', 'Kiwi')
        graph.addEdge('Apple', 'Dragonfruit')
        graph.addEdge('Dragonfruit', 'Banana')
        graph.addEdge('Kiwi', 'Banana')

        let layout = new Layout(graph)
        let renderer = new Renderer(this.canvas, graph, 400, 300)
        renderer.draw()
    }

    
    private Cytoscape(container: HTMLElement) {  
        console.log(" 4. Cytoscaping");

        let cy = cytoscape({
            container: container,
    
            style: [
            {
                selector: 'node',
                style: {
                'content': 'data(id)',
                'text-opacity': 0.5,
                'text-valign': 'center',
                'text-halign': 'right',
                'background-color': '#11479e'
                }
            },
        
            {
                selector: 'edge',
                style: {
                'curve-style': 'bezier',
                'width': 4,
                'target-arrow-shape': 'triangle',
                'line-color': '#9dbaea',
                'target-arrow-color': '#9dbaea'
                }
            }
            ],
        
            elements: {
            nodes: [
                { data: { id: 'n0' } },
                { data: { id: 'n1' } },
                { data: { id: 'n2' } },
                { data: { id: 'n3' } },
                { data: { id: 'n4' } },
                { data: { id: 'n5' } },
                { data: { id: 'n6' } },
                { data: { id: 'n7' } },
                { data: { id: 'n8' } },
                { data: { id: 'n9' } },
                { data: { id: 'n10' } },
                { data: { id: 'n11' } },
                { data: { id: 'n12' } },
                { data: { id: 'n13' } },
                { data: { id: 'n14' } },
                { data: { id: 'n15' } },
                { data: { id: 'n16' } }
            ],
            edges: [
                { data: { source: 'n0', target: 'n1' } },
                { data: { source: 'n1', target: 'n2' } },
                { data: { source: 'n1', target: 'n3' } },
                { data: { source: 'n4', target: 'n5' } },
                { data: { source: 'n4', target: 'n6' } },
                { data: { source: 'n6', target: 'n7' } },
                { data: { source: 'n6', target: 'n8' } },
                { data: { source: 'n8', target: 'n9' } },
                { data: { source: 'n8', target: 'n10' } },
                { data: { source: 'n11', target: 'n12' } },
                { data: { source: 'n12', target: 'n13' } },
                { data: { source: 'n13', target: 'n14' } },
                { data: { source: 'n13', target: 'n15' } },
            ]
            },
            });
    }

    private ParseDependencies(text: string) {
        let input = text;
        let counter = 10
        while (input != "" && counter > 0) {
            console.log(" New Cycle + " + input);

            let operator = input.match(this.operatorRegex);
            console.log(" Operator + " + operator);

            if (operator != null) {
                input = input.substring(operator.length, input.length);
                console.log(operator + " - " + input);
            }

            counter -- ;
        }
    }

    public render(text: string): string {
        // try {
        //     if (text != null) {
        //         console.log(text);

        //         let dep = text.match(this.dependenciesRegex);
        //         console.log(dep);
        //         if (dep != null) {
        //             this.ParseDependencies(dep[0]);
        //         }
        //     }
        // } catch (error) {
        //     console.log(error);
        // }
        console.log(" 0. Init");


        // if (!this.rendered) {
        //     console.log(" 1. Render Started");

        //     this.canvas = document.createElement("timeline");
        //     this.canvas.id = "timeline";
            
        //     document.onclick = () => { 
            
        //         if (!this.loaded) {
        //             console.log(" 3. DOM Attached");

        //             let element = document.getElementById('timeline');
                    
        //             console.log(element);

        //             if (element) {
        //                 element.style.width = "100%";
        //                 element.style.height = "100%";
        //                 element.style.position = "inherit";

        //                 this.Cytoscape(element);
        //             } 

        //             this.loaded = true;
        //         }
        //     }

        //     //this.Cytoscape();
        //     //this.graph = d3.select(this.canvas);

        //     // this.generateCicrle();

        //     // this.generateTimeline(this.canvas);

        //     //this.generateGraph(this.graph);

        //     console.log(this.canvas.outerHTML);
        //     console.log(" 2. Created DOM");

        //     this.widget = this.canvas.outerHTML;
        //     this.rendered = true;
        // }

        return this.widget;
    }
}