// script.js for NeuroNova website

document.addEventListener('DOMContentLoaded', () => {
    // --- Custom Modal UI for Messages (replaces alert/confirm) ---
    const modalContainer = document.createElement('div');
    modalContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        visibility: hidden;
        opacity: 0;
        transition: visibility 0s, opacity 0.3s ease;
    `;
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background-color: white;
        padding: 25px;
        border-radius: 8px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        max-width: 400px;
        width: 90%;
        text-align: center;
        color: #333;
        font-family: 'Segoe UI', sans-serif;
    `;
    const modalMessage = document.createElement('p');
    modalMessage.style.cssText = `
        font-size: 1.1rem;
        margin-bottom: 20px;
        line-height: 1.5;
    `;
    const modalCloseButton = document.createElement('button');
    modalCloseButton.textContent = 'OK';
    modalCloseButton.style.cssText = `
        background-color: #007a63;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 600;
        transition: background-color 0.3s ease;
    `;
    modalCloseButton.addEventListener('mouseover', () => {
        modalCloseButton.style.backgroundColor = '#005f4a';
    });
    modalCloseButton.addEventListener('mouseout', () => {
        modalCloseButton.style.backgroundColor = '#007a63';
    });

    modalContent.appendChild(modalMessage);
    modalContent.appendChild(modalCloseButton);
    modalContainer.appendChild(modalContent);
    document.body.appendChild(modalContainer);

    /**
     * Displays a custom modal with a given message.
     * @param {string} messageText - The message to display in the modal.
     */
    function showCustomModal(messageText) {
        modalMessage.textContent = messageText;
        modalContainer.style.visibility = 'visible';
        modalContainer.style.opacity = '1';
    }

    // Close modal when OK button is clicked or outside modal is clicked
    modalCloseButton.addEventListener('click', () => {
        modalContainer.style.visibility = 'hidden';
        modalContainer.style.opacity = '0';
    });
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            modalContainer.style.visibility = 'hidden';
            modalContainer.style.opacity = '0';
        }
    });

    // --- Form Handlers ---

    // Contact Form Handler (for contact.html)
    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        const authNote = document.getElementById('contact-auth-note');
        const messagesSection = document.getElementById('messages-section');
        const messagesList = document.getElementById('messages-list');
        let currentUserId = null;

        // Check login status, prefill name/email, load past messages
        fetch('/users/me')
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('not logged in');
            })
            .then(user => {
                currentUserId = user._id;
                document.getElementById('name').value = user.name;
                document.getElementById('email').value = user.email;
                messagesSection.style.display = '';
                loadMessages();
            })
            .catch(() => {
                contactForm.style.display = 'none';
                authNote.style.display = '';
            });

        async function loadMessages() {
            if (!currentUserId) return;
            const res = await fetch(`/message/${currentUserId}`);
            const messages = await res.json();
            messagesList.innerHTML = '';

            if (messages.length === 0) {
                messagesList.innerHTML = '<p>No messages yet.</p>';
                return;
            }

            messages.forEach(msg => {
                const item = document.createElement('div');
                item.className = 'message-item';
                item.innerHTML = `
                    <p class="msg-content">${msg.content}</p>
                    <button class="edit-btn">Edit</button>
                `;

                item.querySelector('.edit-btn').addEventListener('click', () => {
                    const textarea = document.createElement('textarea');
                    textarea.value = msg.content;
                    const saveBtn = document.createElement('button');
                    saveBtn.textContent = 'Save';

                    item.innerHTML = '';
                    item.appendChild(textarea);
                    item.appendChild(saveBtn);

                    saveBtn.addEventListener('click', async () => {
                        const res = await fetch(`/message/notes/${msg._id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ content: textarea.value.trim() })
                        });
                        if (res.ok) loadMessages();
                        else showCustomModal('Failed to update message.');
                    });
                });

                messagesList.appendChild(item);
            });
        }

        // Send a new message
        contactForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const message = document.getElementById("message").value.trim();

            if (!name || !email || !message) {
                showCustomModal("Please fill out all the fields.");
                return;
            }

            const res = await fetch('/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, content: message })
            });
            const data = await res.json();

            if (!res.ok) {
                showCustomModal(data.error || 'Failed to send message.');
                return;
            }

            showCustomModal('Message sent successfully!');
            document.getElementById('message').value = '';
            loadMessages();
        });
    }
    
    // ===== Waitlist Auth Logic =====
    const authSection = document.getElementById('auth-section');
    const memberSection = document.getElementById('member-section');
    const waitlistForm = document.getElementById('waitlist-form');

    if (waitlistForm) {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const radioGroup = document.querySelector('.radio-group');
        const agreeCheckbox = document.getElementById('agree');
        const submitBtn = document.getElementById('submit-btn');
        const formTitle = document.getElementById('form-title');
        const formSubtitle = document.getElementById('form-subtitle');
        const toggleLink = document.getElementById('toggle-link');
        const toggleText = document.getElementById('toggle-text');
        const formError = document.getElementById('form-error');
        const welcomeMessage = document.getElementById('welcome-message');
        const logoutBtn = document.getElementById('logout-btn');

        let mode = 'signup';

        // Check if already logged in
        fetch('/users/me', { credentials: 'include' })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('not logged in');
            })
            .then(user => showMemberSection(user))
            .catch(() => { /* not logged in, show form */ });

        function showMemberSection(user) {
            authSection.style.display = 'none';
            memberSection.style.display = 'block';
            welcomeMessage.textContent = `Welcome back, ${user.name}!`;
        }

        function showAuthSection() {
            authSection.style.display = 'block';
            memberSection.style.display = 'none';
        }

        // Toggle between Signup and Login modes
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            formError.textContent = '';

            if (mode === 'signup') {
                mode = 'login';
                formTitle.textContent = 'Log In';
                formSubtitle.textContent = 'Welcome back! Log in to access the waitlist.';
                nameInput.style.display = 'none';
                nameInput.required = false;
                radioGroup.style.display = 'none';
                agreeCheckbox.required = false;
                submitBtn.textContent = 'Log In';
                toggleText.textContent = "Don't have an account?";
                toggleLink.textContent = 'Sign up';
            } else {
                mode = 'signup';
                formTitle.textContent = 'Join';
                formSubtitle.textContent = 'Be the first to know when we launch. Sign up to join!';
                nameInput.style.display = '';
                nameInput.required = true;
                radioGroup.style.display = '';
                agreeCheckbox.required = true;
                submitBtn.textContent = 'Join Waitlist';
                toggleText.textContent = 'Already have an account?';
                toggleLink.textContent = 'Log in';
            }
        });

        // Form submit
        waitlistForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            formError.textContent = '';

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            try {
                if (mode === 'signup') {
                    const name = nameInput.value.trim();

                    const signupRes = await fetch('/users/signup', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, email, password })
                    });
                    const signupData = await signupRes.json();
                    if (!signupRes.ok) {
                        formError.textContent = signupData.error || 'Signup failed';
                        return;
                    }
                }

                // Login (also runs right after signup, to create the session)
                const loginRes = await fetch('/users/login', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const loginData = await loginRes.json();
                if (!loginRes.ok) {
                    formError.textContent = loginData.error || 'Login failed';
                    return;
                }

                showMemberSection(loginData);
                waitlistForm.reset();

            } catch (err) {
                formError.textContent = 'Something went wrong. Please try again.';
            }
        });

        // Logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await fetch('/users/logout', { method: 'POST', credentials: 'include' });
                showAuthSection();
            });
        }
    }

    // Waitlist Form Handler 2 (if a different waitlist form ID exists, e.g., on a specific waitlist.html)
    const waitlistFormSpecific = document.getElementById("waitlistForm");
    if (waitlistFormSpecific) {
        waitlistFormSpecific.addEventListener("submit", function (e) {
            e.preventDefault();

            const email = document.getElementById("email").value.trim();
            const agree = document.getElementById("agree").checked;

            if (!email) {
                showCustomModal("Please enter your email.");
                return;
            }

            if (!email.includes("@")) {
                showCustomModal(`${email} is missing '@'. Please include a valid email address.`);
                return;
            }

            const parts = email.split("@");
            if (parts.length < 2 || parts[1].trim() === "") {
                showCustomModal("Please enter the part after '@' in your email address.");
                return;
            }

            if (!agree) {
                showCustomModal("You must agree to receive updates.");
                return;
            }

            showCustomModal(`Email: ${email}\nConsent: Yes, you agreed to receive updates.`);
            // In a real application, you would send this data to a server here.
            waitlistFormSpecific.reset();
        });
    }


    // --- Tech Advancements Page Logic ---

    const techGrid = document.getElementById('techGrid');
    const categoryFilter = document.getElementById('categoryFilter');
    const refreshBtn = document.getElementById('refreshBtn');

    // Base URL for Hacker News API
    const API_BASE_URL = 'https://hn.algolia.com/api/v1/';

    // Define categories based on Hacker News tags
    const categories = {
        'all': 'All Categories',
        'story': 'Stories',
        'ask_hn': 'Ask HN',
        'show_hn': 'Show HN',
        'front_page': 'Front Page',
        'comment': 'Comments'
    };

    /**
     * Populates the category filter dropdown with options from the categories object.
     */
    function populateCategories() {
        categoryFilter.innerHTML = ''; // Clear any existing options
        for (const tag in categories) {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = categories[tag];
            categoryFilter.appendChild(option);
        }
    }

    /**
     * Displays a message (loading, error, or no results) in the tech grid area.
     * @param {string} type - 'loading', 'error', or 'no-results'.
     * @param {string} message - The specific message content to display.
     */
    function showGridMessage(type, message = '') {
        techGrid.innerHTML = ''; // Clear previous content
        const div = document.createElement('div');
        div.classList.add('message');

        if (type === 'loading') {
            div.innerHTML = '<div class="loading-spinner"></div><p>Loading tech advancements...</p>';
        } else if (type === 'error') {
            div.innerHTML = `<p style="color: #e53e3e;">Error fetching data: ${message}. Please try again later.</p>`;
        } else if (type === 'no-results') {
            div.innerHTML = `<p>${message || 'No tech advancements found for the selected filter.'}</p>`;
        }
        techGrid.appendChild(div);
    }

    /**
     * Fetches tech advancements from the Hacker News API based on the selected tag.
     * It uses the 'search_by_date' endpoint to get the latest items.
     * @param {string} tag - The tag to filter the search results by (e.g., 'story', 'front_page').
     */
    async function fetchTechAdvancements(tag = 'story') {
        showGridMessage('loading'); // Show loading spinner before fetching

        let apiUrl = `${API_BASE_URL}search_by_date?`;
        if (tag === 'all') {
            apiUrl += `tags=story`; // Default to stories if 'all' is selected
        } else {
            apiUrl += `tags=${tag}`;
        }
        apiUrl += `&hitsPerPage=30`; // Fetch 30 items per request

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            displayTechAdvancements(data.hits);
        } catch (error) {
            console.error('Failed to fetch tech advancements:', error);
            showGridMessage('error', error.message);
        }
    }

    /**
     * Displays the fetched tech advancements as cards in the grid.
     * Filters out items without a title or URL as they are not suitable for display.
     * @param {Array} hits - An array of tech advancement objects from the Hacker News API.
     */
    function displayTechAdvancements(hits) {
        techGrid.innerHTML = ''; // Clear current grid content

        if (!hits || hits.length === 0) {
            showGridMessage('no-results');
            return;
        }

        hits.forEach(hit => {
            if (!hit.title && !hit.story_title) return;
            if (!hit.url && !hit.story_url) return;

            const card = document.createElement('div');
            card.classList.add('card'); // Using 'card' class as per your CSS

            const title = hit.title || hit.story_title;
            const url = hit.url || hit.story_url;
            const author = hit.author || 'N/A';
            const points = hit.points !== null ? hit.points : 'N/A';
            const numComments = hit.num_comments !== null ? hit.num_comments : 'N/A';
            const createdAt = hit.created_at ? new Date(hit.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : 'N/A';

            card.innerHTML = `
                <h3><a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a></h3>
                <p>By: ${author}</p>
                <div class="meta">
                    <span>⚡ Points: ${points}</span>
                    <span>💬 Comments: ${numComments}</span>
                    <span>📅 Date: ${createdAt}</span>
                </div>
            `;
            techGrid.appendChild(card);
        });
    }

    // --- Event Listeners for Tech Page ---
    if (categoryFilter && refreshBtn && techGrid) { // Only set up if these elements exist (on tech.html)
        categoryFilter.addEventListener('change', (event) => {
            fetchTechAdvancements(event.target.value);
        });

        refreshBtn.addEventListener('click', () => {
            fetchTechAdvancements(categoryFilter.value);
        });

        // Initial load for tech page: Populate categories and fetch default advancements (stories)
        populateCategories();
        fetchTechAdvancements('story');
    }
});
