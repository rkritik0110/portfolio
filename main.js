import * as THREE from 'three';

// Global variables for 3D scene
let scene, camera, renderer;
let hyperspaceLines = [];
let backgroundStars = [];
let animationId;

// Configuration
const CONFIG = {
    lineCount: 200,
    starCount: 500,
    lineSpeed: 0.8,
    starSpeed: 0.02,
    lineLength: 50,
    maxDistance: 100,
    colors: {
        primary: 0x00f5ff,    // Cyan
        secondary: 0x8b5cf6,  // Purple
        accent: 0xff6b6b,     // Red
        white: 0xffffff
    }
};

// Hyperspace line class
class HyperspaceLine {
    constructor() {
        this.reset();
        this.createGeometry();
    }
    
    reset() {
        // Random starting position in a circle around center
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 20 + 5;
        
        this.startX = Math.cos(angle) * radius;
        this.startY = Math.sin(angle) * radius;
        this.startZ = -CONFIG.maxDistance;
        
        // Direction vector (pointing toward camera)
        this.directionX = this.startX * 0.1;
        this.directionY = this.startY * 0.1;
        this.directionZ = 1;
        
        // Line properties
        this.speed = CONFIG.lineSpeed + Math.random() * 0.5;
        this.thickness = Math.random() * 2 + 1;
        this.brightness = Math.random() * 0.5 + 0.5;
        this.length = CONFIG.lineLength + Math.random() * 20;
        
        // Color variation
        const colorChoice = Math.random();
        if (colorChoice < 0.6) {
            this.color = new THREE.Color(CONFIG.colors.primary);
        } else if (colorChoice < 0.8) {
            this.color = new THREE.Color(CONFIG.colors.secondary);
        } else {
            this.color = new THREE.Color(CONFIG.colors.white);
        }
        
        this.color.multiplyScalar(this.brightness);
        
        this.currentZ = this.startZ;
    }
    
    createGeometry() {
        // Create line geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(6); // 2 points * 3 coordinates
        const colors = new Float32Array(6);    // 2 points * 3 color components
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Create material with additive blending for glow effect
        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        this.line = new THREE.Line(geometry, material);
        this.updateGeometry();
    }
    
    updateGeometry() {
        const positions = this.line.geometry.attributes.position.array;
        const colors = this.line.geometry.attributes.color.array;
        
        // Calculate current position
        const progress = (this.currentZ + CONFIG.maxDistance) / CONFIG.maxDistance;
        const currentX = this.startX + this.directionX * progress * 10;
        const currentY = this.startY + this.directionY * progress * 10;
        
        // Line start point (further back)
        positions[0] = currentX;
        positions[1] = currentY;
        positions[2] = this.currentZ - this.length;
        
        // Line end point (current position)
        positions[3] = currentX;
        positions[4] = currentY;
        positions[5] = this.currentZ;
        
        // Color gradient (dimmer at start, brighter at end)
        const startAlpha = 0.1;
        const endAlpha = Math.min(1.0, progress * 2);
        
        // Start point color (dimmer)
        colors[0] = this.color.r * startAlpha;
        colors[1] = this.color.g * startAlpha;
        colors[2] = this.color.b * startAlpha;
        
        // End point color (brighter)
        colors[3] = this.color.r * endAlpha;
        colors[4] = this.color.g * endAlpha;
        colors[5] = this.color.b * endAlpha;
        
        this.line.geometry.attributes.position.needsUpdate = true;
        this.line.geometry.attributes.color.needsUpdate = true;
    }
    
    update() {
        this.currentZ += this.speed;
        
        // Reset line when it passes the camera
        if (this.currentZ > 10) {
            this.reset();
        }
        
        this.updateGeometry();
    }
}

// Background star class
class BackgroundStar {
    constructor() {
        this.reset();
        this.createGeometry();
    }
    
    reset() {
        this.x = (Math.random() - 0.5) * 200;
        this.y = (Math.random() - 0.5) * 200;
        this.z = Math.random() * -200 - 50;
        this.size = Math.random() * 2 + 0.5;
        this.twinkleSpeed = Math.random() * 0.02 + 0.01;
        this.twinkleOffset = Math.random() * Math.PI * 2;
        
        // Subtle color variation
        const colorChoice = Math.random();
        if (colorChoice < 0.7) {
            this.baseColor = new THREE.Color(0xffffff);
        } else if (colorChoice < 0.9) {
            this.baseColor = new THREE.Color(CONFIG.colors.primary);
        } else {
            this.baseColor = new THREE.Color(CONFIG.colors.secondary);
        }
    }
    
    createGeometry() {
        const geometry = new THREE.SphereGeometry(0.1, 4, 4);
        const material = new THREE.MeshBasicMaterial({
            color: this.baseColor,
            transparent: true,
            opacity: 0.6
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.x, this.y, this.z);
        this.mesh.scale.setScalar(this.size);
    }
    
    update(time) {
        // Slow forward movement
        this.z += CONFIG.starSpeed;
        
        // Reset star when it passes the camera
        if (this.z > 10) {
            this.reset();
        }
        
        // Twinkling effect
        const twinkle = Math.sin(time * this.twinkleSpeed + this.twinkleOffset) * 0.3 + 0.7;
        this.mesh.material.opacity = twinkle * 0.6;
        
        this.mesh.position.set(this.x, this.y, this.z);
    }
}

// Initialize Three.js scene
function initThreeJS() {
    const canvas = document.getElementById('space-canvas');
    
    // Scene setup
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 50, 200);
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 0);
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    
    // Create hyperspace lines
    createHyperspaceLines();
    
    // Create background stars
    createBackgroundStars();
    
    // Start animation loop
    animate();
}

function createHyperspaceLines() {
    hyperspaceLines = [];
    
    for (let i = 0; i < CONFIG.lineCount; i++) {
        const line = new HyperspaceLine();
        // Stagger initial positions for smoother effect
        line.currentZ = line.startZ + (i / CONFIG.lineCount) * CONFIG.maxDistance;
        hyperspaceLines.push(line);
        scene.add(line.line);
    }
}

function createBackgroundStars() {
    backgroundStars = [];
    
    for (let i = 0; i < CONFIG.starCount; i++) {
        const star = new BackgroundStar();
        // Distribute stars throughout the depth
        star.z = Math.random() * -200 - 10;
        backgroundStars.push(star);
        scene.add(star.mesh);
    }
}

function animate() {
    animationId = requestAnimationFrame(animate);
    
    const time = Date.now() * 0.001;
    
    // Update hyperspace lines
    hyperspaceLines.forEach(line => {
        line.update();
    });
    
    // Update background stars
    backgroundStars.forEach(star => {
        star.update(time);
    });
    
    // Subtle camera movement for immersion
    camera.position.x = Math.sin(time * 0.1) * 0.5;
    camera.position.y = Math.cos(time * 0.15) * 0.3;
    
    // Render the scene
    renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Performance optimization
function handleVisibilityChange() {
    if (document.hidden) {
        // Pause animation when tab is not visible
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    } else {
        // Resume animation when tab becomes visible
        if (!animationId) {
            animate();
        }
    }
}

// Cleanup function
function cleanup() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    // Dispose of geometries and materials
    hyperspaceLines.forEach(line => {
        line.line.geometry.dispose();
        line.line.material.dispose();
        scene.remove(line.line);
    });
    
    backgroundStars.forEach(star => {
        star.mesh.geometry.dispose();
        star.mesh.material.dispose();
        scene.remove(star.mesh);
    });
    
    if (renderer) {
        renderer.dispose();
    }
}

// Smooth scrolling
function smoothScroll() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
            
            // Update active nav link
            navLinks.forEach(nl => nl.classList.remove('active'));
            link.classList.add('active');
            
            // Close mobile menu if open
            const navMenu = document.querySelector('.nav-menu');
            navMenu.classList.remove('active');
        });
    });
}

// Mobile navigation toggle
function initMobileNav() {
    const hamburger = document.querySelector('.nav-hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    });
    
    // Close menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });
}

// Scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Add fade-in class to elements
    const animatedElements = document.querySelectorAll('.about-card, .project-card, .contact-item, .skill-category');
    animatedElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
}

// Contact form handling
function initContactForm() {
    const form = document.getElementById('contactForm');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Simulate form submission
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<span>Sending...</span>';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            submitBtn.innerHTML = '<span>Message Sent! ✓</span>';
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                form.reset();
            }, 2000);
        }, 1500);
        
        console.log('Form data:', data);
    });
}

// Navbar scroll effect
function initNavbarScroll() {
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
            navbar.style.backdropFilter = 'blur(15px)';
        } else {
            navbar.style.background = 'rgba(10, 10, 10, 0.9)';
            navbar.style.backdropFilter = 'blur(10px)';
        }
    });
}

// Typewriter effect
function initTypewriter() {
    const typewriterElement = document.querySelector('.typewriter');
    const text = typewriterElement.textContent;
    typewriterElement.textContent = '';
    
    let i = 0;
    function typeWriter() {
        if (i < text.length) {
            typewriterElement.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        }
    }
    
    setTimeout(typeWriter, 1000);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Three.js
    initThreeJS();
    
    // Initialize other features
    smoothScroll();
    initMobileNav();
    initScrollAnimations();
    initContactForm();
    initNavbarScroll();
    initTypewriter();
    
    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Animate stats numbers
    const statNumbers = document.querySelectorAll('.stat-number');
    const observerStats = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const finalNumber = target.textContent;
                const numericValue = parseInt(finalNumber.replace(/\D/g, ''));
                
                let current = 0;
                const increment = numericValue / 50;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= numericValue) {
                        target.textContent = finalNumber;
                        clearInterval(timer);
                    } else {
                        target.textContent = Math.floor(current) + (finalNumber.includes('+') ? '+' : finalNumber.includes('%') ? '%' : '');
                    }
                }, 30);
                
                observerStats.unobserve(target);
            }
        });
    });
    
    statNumbers.forEach(stat => observerStats.observe(stat));
});

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);