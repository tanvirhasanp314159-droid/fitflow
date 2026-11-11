
body {
    background-color: #F4EFE6;
    color: #2C2A29;
    font-family: 'Inter', sans-serif;

    background-image:
        linear-gradient(
            to right,
            rgba(200, 180, 140, 0.1) 1px,
            transparent 1px
        ),
        linear-gradient(
            to bottom,
            rgba(200, 180, 140, 0.1) 1px,
            transparent 1px
        );

    background-size: 24px 24px;
}

h1, h2, h3, .font-serif {
    font-family: 'Playfair Display', Georgia, serif;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

::-webkit-scrollbar-track {
    background: #E8DEC9;
}

::-webkit-scrollbar-thumb {
    background: #C7B484;
    border-radius: 3px;
}

/* Smooth page transitions */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(6px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
}
