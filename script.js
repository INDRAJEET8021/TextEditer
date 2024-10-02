const addTextBtn = document.getElementById('add-text-btn');
const textContainer = document.getElementById('text-container');
const verticalLine = document.getElementById('vertical-line');
const horizontalLine = document.getElementById('horizontal-line');
let history = [];
let undoStack = [];

let draggedElement = null;
let selectedElement = null;
let offsetX = 0;
let offsetY = 0;

// Initialize history with the initial state
saveState();

// Add default text on page load
window.addEventListener('DOMContentLoaded', () => {
    addDefaultTexts();
    saveState();
});

// Function to add default texts (only one)
function addDefaultTexts() {
    const defaultText = {
        text: 'Welcome to the Editor! Click to edit.',
        top: '20px',
        left: '20px'
    };

    const textElement = document.createElement('div');
    textElement.classList.add('draggable');
    textElement.setAttribute('contenteditable', 'true');
    textElement.classList.add('editable');
    textElement.innerText = defaultText.text;
    textElement.style.top = defaultText.top;
    textElement.style.left = defaultText.left;
    textContainer.appendChild(textElement);

    makeDraggable(textElement);
    selectTextElement(textElement); // Automatically select the default text
}

// Add new text to container
addTextBtn.addEventListener('click', () => {
    const textElement = document.createElement('div');
    textElement.classList.add('draggable');
    textElement.setAttribute('contenteditable', 'true');
    textElement.classList.add('editable');
    textElement.innerText = 'Click to edit';
    textElement.style.top = '50px';
    textElement.style.left = '50px';
    textContainer.appendChild(textElement);

    makeDraggable(textElement);
    selectTextElement(textElement); // Automatically select the new text
    saveState();
});

// Make element draggable
function makeDraggable(element) {
    let isDragging = false;

    element.addEventListener('mousedown', (e) => {
        // Only start dragging if the click is not on the text (to allow text selection)
        if (e.target === element || e.target.closest('.draggable') === element) {
            isDragging = true;
            draggedElement = element;
            const rect = element.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            element.style.zIndex = 1000; // Bring the text to the front
            showGuidelines(e.clientX - textContainer.getBoundingClientRect().left - offsetX,
                          e.clientY - textContainer.getBoundingClientRect().top - offsetY);
            selectTextElement(element);
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (isDragging && draggedElement) {
            const containerRect = textContainer.getBoundingClientRect();
            let x = e.clientX - containerRect.left - offsetX;
            let y = e.clientY - containerRect.top - offsetY;

            // Ensure the element stays within the container
            const maxX = textContainer.clientWidth - draggedElement.offsetWidth;
            const maxY = textContainer.clientHeight - draggedElement.offsetHeight;
            x = Math.min(Math.max(x, 0), maxX);
            y = Math.min(Math.max(y, 0), maxY);

            draggedElement.style.left = `${x}px`;
            draggedElement.style.top = `${y}px`;

            // Show dotted lines
            showGuidelines(x, y);
        }
    });

    window.addEventListener('mouseup', () => {
        if (isDragging && draggedElement) {
            draggedElement.style.zIndex = ''; // Reset z-index
            draggedElement = null;
            isDragging = false;
            hideGuidelines();
            saveState();
        }
    });
}

// Show guidelines
function showGuidelines(x, y) {
    verticalLine.style.left = `${x}px`;
    verticalLine.style.display = 'block';

    horizontalLine.style.top = `${y}px`;
    horizontalLine.style.display = 'block';
}

// Hide guidelines
function hideGuidelines() {
    verticalLine.style.display = 'none';
    horizontalLine.style.display = 'none';
}

// Select text element for editing
function selectTextElement(element) {
    if (selectedElement && selectedElement !== element) {
        selectedElement.classList.remove('active');
    }
    selectedElement = element;
    selectedElement.classList.add('active');
    updateFontStyles();
}

// Deselect when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.draggable') && !e.target.closest('.toolbar')) {
        if (selectedElement) {
            selectedElement.classList.remove('active');
            selectedElement = null;
        }
    }
});

// Font size control
const fontSizeInput = document.getElementById('font-size');
const increaseFontBtn = document.getElementById('increase-font');
const decreaseFontBtn = document.getElementById('decrease-font');

increaseFontBtn.addEventListener('click', () => {
    const newSize = parseInt(fontSizeInput.value) + 1;
    fontSizeInput.value = newSize;
    if (selectedElement) {
        selectedElement.style.fontSize = `${newSize}px`;
        saveState();
    }
});

decreaseFontBtn.addEventListener('click', () => {
    let newSize = parseInt(fontSizeInput.value) - 1;
    if (newSize < 1) newSize = 1; // Prevent negative or zero font size
    fontSizeInput.value = newSize;
    if (selectedElement) {
        selectedElement.style.fontSize = `${newSize}px`;
        saveState();
    }
});

// Font family control
const fontSelector = document.getElementById('font-selector');
fontSelector.addEventListener('change', () => {
    if (selectedElement) {
        selectedElement.style.fontFamily = fontSelector.value;
        saveState();
    }
});

// Text formatting (Bold, Italic, Underline)
const boldBtn = document.getElementById('bold-btn');
const italicBtn = document.getElementById('italic-btn');
const underlineBtn = document.getElementById('underline-btn');

boldBtn.addEventListener('click', () => {
    if (selectedElement) {
        selectedElement.style.fontWeight = selectedElement.style.fontWeight === 'bold' ? 'normal' : 'bold';
        saveState();
    }
});

italicBtn.addEventListener('click', () => {
    if (selectedElement) {
        selectedElement.style.fontStyle = selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic';
        saveState();
    }
});

underlineBtn.addEventListener('click', () => {
    if (selectedElement) {
        selectedElement.style.textDecoration = selectedElement.style.textDecoration === 'underline' ? 'none' : 'underline';
        saveState();
    }
});

// Save state for undo/redo functionality
function saveState() {
    const currentState = textContainer.innerHTML;
    history.push(currentState);
    undoStack = []; // Clear redo stack on new action
}

// Undo and Redo functionality
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');

undoBtn.addEventListener('click', () => {
    if (history.length > 1) { // Ensure there's a state to undo to
        const currentState = history.pop();
        undoStack.push(currentState);
        const previousState = history[history.length - 1];
        textContainer.innerHTML = previousState;
        reapplyDraggable();
    }
});

redoBtn.addEventListener('click', () => {
    if (undoStack.length > 0) {
        const redoState = undoStack.pop();
        history.push(redoState);
        textContainer.innerHTML = redoState;
        reapplyDraggable();
    }
});

// Reapply draggable to text elements after undo/redo
function reapplyDraggable() {
    const textElements = document.querySelectorAll('.draggable');
    textElements.forEach((textElement) => {
        makeDraggable(textElement);
    });
}

// Update font styles based on selected text element
function updateFontStyles() {
    if (selectedElement) {
        const computedStyle = window.getComputedStyle(selectedElement);
        fontSizeInput.value = parseInt(computedStyle.fontSize);
        // Handle font family names with spaces
        const fontFamily = computedStyle.fontFamily.replace(/['"]/g, "");
        const fontOptions = Array.from(fontSelector.options).map(option => option.value);
        const matchedFont = fontOptions.find(font => fontFamily.includes(font));
        fontSelector.value = matchedFont || 'Arial';
    }
}

// Keyboard shortcuts for Undo (Ctrl+Z) and Redo (Ctrl+Y)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undoBtn.click();
    }
    if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redoBtn.click();
    }
});