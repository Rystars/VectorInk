
class SimplePanAndZoom {
    // The zoom and pan logic is extracted into functions that
    // produce the new zoom (or center) given the old zoom (or center) and mouse wheel deltas.

    // Compute the new zoom factor from the old
    // zoom factor and some delta that is given to us by the mousewheel plugin.
    changeZoom(oldZoom, delta) {
    const factor = 1.05;
    if (delta < 0) {
        return oldZoom * factor;
    }
    if (delta > 0) {
        return oldZoom / factor;
    }
    return oldZoom;
    }

    // Compute the new center from old center and the delta given by the mousewheel plugin.
    changeCenter(oldCenter, deltaX, deltaY, factor, zoom) {
		//console.log(deltaX, deltaY, factor)
		//let offset = new paper.Point(deltaX, -deltaY);
		let offset = new paper.Point(deltaX/zoom, -deltaY/zoom);
		offset = offset.multiply(factor);
		//console.log('offset', offset, 'deltaX', deltaX, 'deltaY', deltaY, 'factor', factor, 'zoom', zoom, 'result', oldCenter.add(offset))
		return oldCenter.add(offset);
    }
}

class StableZoom extends SimplePanAndZoom {
    changeZoom(oldZoom, delta, c, p) {
    const newZoom = super.changeZoom(oldZoom, delta);
    const beta = oldZoom / newZoom;
    const pc = p.subtract(c);
    const a = p.subtract(pc.multiply(beta)).subtract(c);
    return [newZoom, a];
    }
}

/*
const drawGrid = function(width, height) {
    let line;
    new paper.Path.Rectangle({from: [0, 0], to: [width, height], fillColor: 'white'});
    // Style: thick major grid lines, thin minor lines
    const lineStyle = function(coord) {
    if ((coord % 50) === 0) {
        return {strokeColor: 'lightblue', strokeWidth: 2};
    } else {
        return {strokeColor: 'lightblue', strokeWidth: 1};
    }
    };
    // Draw vertical lines
    for (let x = 0, end = width; x <= end; x += 10) {
    line = new paper.Path.Line({segments: [[x, 0], [x, height]]});
    line.set(lineStyle(x));
    }
    // Draw horizontal lines
    return (() => {
    const result = [];
    for (let y = 0, end1 = height; y <= end1; y += 10) {
        line = new paper.Path.Line({segments: [[0, y], [width, y]]});
        result.push(line.set(lineStyle(y)));
    }
    return result;
    })();
};

const example1 = function(canvasID) {
    // Setup the `paper` object
    const canvas = document.getElementById(canvasID);
    paper.setup(canvas);
    // Remember the current view so we can access it in event handlers.
    const {
    view
    } = paper;

    // Create a grid and a circle.
    const width = 600;
    const height = 300;
    drawGrid(width, height);
    new paper.Path.Circle({center: [100, 100], radius: 20, fillColor: 'green'});
    const box = new paper.Path.Rectangle({from: [0,0], to: [10,10], fillColor: 'gray'});
    box.position = view.center;

    // Use a `SimplePanAndZoom` to translate from mouse events to changes in the view.
    const panAndZoom = new SimplePanAndZoom();

    // We use the jquery-mousewheel plugin to get the events.
    $(`#${canvasID}`).mousewheel(function(event) {
    if (event.shiftKey) {
        view.center = panAndZoom.changeCenter(view.center, event.deltaX, event.deltaY, event.deltaFactor);
        return event.preventDefault();
    } else if (event.altKey) {
        view.zoom = panAndZoom.changeZoom(view.zoom, event.deltaY);
        return event.preventDefault();
    }
    });


    // When using paper.js from javascript directly, you have to call
    // `view.draw()` to draw the scene.
    return view.draw();
};
*/

// Example 2
// ---------
/*
const example2 = function(canvasID) {
    // Setup the `paper` object
    const canvas = document.getElementById(canvasID);
    paper.setup(canvas);
    // Remember the current view so we can access it in event handlers.
    const {
    view
    } = paper;

    // Create a grid and a circle.
    const width = 600;
    const height = 300;
    drawGrid(width, height);
    new paper.Path.Circle({center: [100, 100], radius: 20, fillColor: 'teal'});

    // Use a `StableZoom` to translate from mouse events to changes in the view.
    const panAndZoom = new StableZoom();

    // We use the jquery-mousewheel plugin to get the events.
    $(`#${canvasID}`).mousewheel(function(event) {
    if (event.shiftKey) {
        view.center = panAndZoom.changeCenter(view.center, event.deltaX, event.deltaY, event.deltaFactor);
        return event.preventDefault();
    } else if (event.altKey) {
        const mousePosition = new paper.Point(event.offsetX, event.offsetY);
        // We use `viewToProject()`, an undocumented paper.js function that converts mouse coordinates
        // to project coordinates. When you use the
        // [paper.js event handling](http://paperjs.org/tutorials/interaction/creating-mouse-tools/)
        // this conversion is already done for you.
        const viewPosition = view.viewToProject(mousePosition);
        const [newZoom, offset] = Array.from(panAndZoom.changeZoom(view.zoom, event.deltaY, view.center, viewPosition));
        view.zoom = newZoom;
        view.center = view.center.add(offset);
        event.preventDefault();
        return view.draw();
    }
    });

    // When using paper.js from javascript directly, you have to call
    // `view.draw()` to draw the scene.
    return view.draw();
};
*/