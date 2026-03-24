const API_URL = 'http://localhost:3000';

let authToken = null;
let currentPipelineId = null;
let skillsArray = [];

const token = localStorage.getItem('token');
if (token) {
    authToken = token;
    showDashboard();
}

window.showRegister = function() {
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('registerPage').classList.add('active');
}

window.showLogin = function() {
    document.getElementById('registerPage').classList.remove('active');
    document.getElementById('loginPage').classList.add('active');
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) throw new Error('Login failed');
        
        const data = await response.json();
        authToken = data.token;
        localStorage.setItem('token', authToken);
        showDashboard();
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) throw new Error('Registration failed');
        
        alert('Registration successful! Please login.');
        showLogin();
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
});

function showDashboard() {
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('registerPage').classList.remove('active');
    document.getElementById('dashboardPage').classList.add('active');
    
    loadPipelines();
    loadJobs();
    loadPipelinesForTester();
    loadPipelinesForChaining();
}

window.logout = function() {
    localStorage.removeItem('token');
    authToken = null;
    document.getElementById('dashboardPage').classList.remove('active');
    document.getElementById('loginPage').classList.add('active');
}

window.showSection = function(section) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    document.querySelectorAll('.section').forEach(sect => {
        sect.classList.remove('active');
    });
    document.getElementById(`${section}Section`).classList.add('active');
    
    if (section === 'pipelines') loadPipelines();
    if (section === 'jobs') loadJobs();
    if (section === 'webhookTester') loadPipelinesForTester();
}

async function loadPipelines() {
    try {
        const response = await fetch(`${API_URL}/pipelines`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load pipelines');
        
        const pipelines = await response.json();
        displayPipelines(pipelines);
    } catch (error) {
        console.error('Error loading pipelines:', error);
        document.getElementById('pipelinesList').innerHTML = '<p style="color: white;">Error loading pipelines. Make sure backend is running on port 5000.</p>';
    }
}

function displayPipelines(pipelines) {
    const container = document.getElementById('pipelinesList');
    
    if (!pipelines || pipelines.length === 0) {
        container.innerHTML = '<p style="color: white;">No pipelines yet. Create one!</p>';
        return;
    }
    
    container.innerHTML = pipelines.map(pipeline => `
        <div class="pipeline-card">
            <h3>${escapeHtml(pipeline.name)}</h3>
            <div class="stats">
                <div class="stat">
                    <div class="label">Total Jobs</div>
                    <div class="value">${pipeline.totalJobs || 0}</div>
                </div>
                <div class="stat">
                    <div class="label">Success</div>
                    <div class="value">${pipeline.successJobs || 0}</div>
                </div>
                <div class="stat">
                    <div class="label">Failed</div>
                    <div class="value">${pipeline.failedJobs || 0}</div>
                </div>
            </div>
            <div class="webhook-info">
                <div>🔗 Webhook URL:</div>
                <code>${API_URL}/webhooks/${pipeline.id}</code>
                <div style="margin-top: 5px;">🔑 Secret: ${pipeline.secret || 'N/A'}</div>
            </div>
            <div class="pipeline-actions">
                <button class="edit-pipeline" onclick="event.stopPropagation(); editPipeline('${pipeline.id}')">✏️ Edit</button>
                <button class="delete-pipeline" onclick="event.stopPropagation(); deletePipeline('${pipeline.id}', '${escapeHtml(pipeline.name)}')">🗑️ Delete</button>
                <button class="edit-pipeline" onclick="event.stopPropagation(); showPipelineDetails('${pipeline.id}')">📋 Details</button>
            </div>
        </div>
    `).join('');
}

window.editPipeline = async function(pipelineId) {
    try {
        const response = await fetch(`${API_URL}/pipelines/${pipelineId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load pipeline');
        
        const pipeline = await response.json();
        
        const modalHtml = `
            <div id="editPipelineModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; justify-content: center; align-items: center;">
                <div style="background: white; border-radius: 12px; max-width: 500px; width: 90%; padding: 24px;">
                    <h2>✏️ Edit Pipeline</h2>
                    <form id="editPipelineForm">
                        <div class="form-group">
                            <label>Pipeline Name</label>
                            <input type="text" id="editPipelineName" value="${escapeHtml(pipeline.name)}" required>
                        </div>
                        <div class="form-group">
                            <label>Action Type</label>
                            <select id="editActionType" disabled style="background: #f5f5f5;">
                                <option value="${pipeline.actionType}">${pipeline.actionType}</option>
                            </select>
                            <small>Action type cannot be changed after creation</small>
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 20px;">
                            <button type="submit" style="flex: 1; padding: 10px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">Save Changes</button>
                            <button type="button" onclick="document.getElementById('editPipelineModal').remove()" style="flex: 1; padding: 10px; background: #f5f5f5; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('editPipelineForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const newName = document.getElementById('editPipelineName').value;
            
            try {
                const updateResponse = await fetch(`${API_URL}/pipelines/${pipelineId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ name: newName })
                });
                
                if (!updateResponse.ok) throw new Error('Failed to update pipeline');
                
                alert('✅ Pipeline updated successfully!');
                document.getElementById('editPipelineModal').remove();
                loadPipelines();
                loadPipelinesForTester();
                loadPipelinesForChaining();
            } catch (error) {
                alert('Error updating pipeline: ' + error.message);
            }
        });
        
    } catch (error) {
        console.error('Error loading pipeline for edit:', error);
        alert('Error loading pipeline: ' + error.message);
    }
};

window.deletePipeline = async function(pipelineId, pipelineName) {
    if (!confirm(`Are you sure you want to delete pipeline "${pipelineName}"?\n\nThis will also delete all associated jobs and subscribers!`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/pipelines/${pipelineId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete pipeline');
        
        alert('✅ Pipeline deleted successfully!');
        loadPipelines();
        loadPipelinesForTester();
        loadPipelinesForChaining();
        loadJobs();
    } catch (error) {
        alert('Error deleting pipeline: ' + error.message);
    }
};

window.showPipelineDetails = async function(pipelineId) {
    currentPipelineId = pipelineId;
    
    try {
        const statsResponse = await fetch(`${API_URL}/pipelines/${pipelineId}/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!statsResponse.ok) {
            const errorText = await statsResponse.text();
            throw new Error(`Failed to load pipeline stats: ${errorText}`);
        }
        
        const stats = await statsResponse.json();
        
        const subsResponse = await fetch(`${API_URL}/subscribers/${pipelineId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!subsResponse.ok) throw new Error('Failed to load subscribers');
        
        const subscribers = await subsResponse.json();
        
        displayPipelineDetails(stats.pipeline, subscribers);
    } catch (error) {
        console.error('Error loading pipeline details:', error);
        alert('Error loading pipeline details: ' + error.message);
    }
};

function displayPipelineDetails(pipeline, subscribers) {
    const modal = document.getElementById('pipelineModal');
    const detailsDiv = document.getElementById('pipelineDetails');
    const subsDiv = document.getElementById('subscribersList');
    
    detailsDiv.innerHTML = `
        <h3>📦 ${escapeHtml(pipeline.name)}</h3>
        <div class="stats" style="margin: 1rem 0;">
            <div class="stat">
                <div class="label">Total Jobs</div>
                <div class="value">${pipeline.totalJobs || 0}</div>
            </div>
            <div class="stat">
                <div class="label">Success</div>
                <div class="value">${pipeline.successJobs || 0}</div>
            </div>
            <div class="stat">
                <div class="label">Failed</div>
                <div class="value">${pipeline.failedJobs || 0}</div>
            </div>
        </div>
        <div style="margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 10px;">
            <strong>🔗 Webhook URL:</strong><br>
            <code style="word-break: break-all; display: block; margin-top: 5px;">${API_URL}/webhooks/${pipeline.id}</code>
            <button onclick="copyToClipboard('${API_URL}/webhooks/${pipeline.id}')" style="margin-top: 5px; padding: 5px 10px;">📋 Copy URL</button>
        </div>
        <div style="margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 10px;">
            <strong>🔑 Secret (Keep it safe!):</strong><br>
            <code style="word-break: break-all; display: block; margin-top: 5px;">${pipeline.secret || 'N/A'}</code>
            <button onclick="copyToClipboard('${pipeline.secret}')" style="margin-top: 5px; padding: 5px 10px;">📋 Copy Secret</button>
        </div>
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee;">
            <button onclick="editPipeline('${pipeline.id}')" class="edit-pipeline" style="margin-right: 10px;">✏️ Edit Pipeline</button>
            <button onclick="deletePipeline('${pipeline.id}', '${escapeHtml(pipeline.name)}')" class="delete-pipeline">🗑️ Delete Pipeline</button>
        </div>
    `;
    
    subsDiv.innerHTML = '<h4>📬 Subscribers</h4>';
    
    if (subscribers && subscribers.length > 0) {
        subscribers.forEach(sub => {
            subsDiv.innerHTML += `
                <div class="subscriber-item">
                    <code style="flex: 1; word-break: break-all;">${escapeHtml(sub.url)}</code>
                    <div>
                        <button class="edit-subscriber" onclick="editSubscriber('${sub.id}', '${escapeHtml(sub.url)}')">✏️ Edit</button>
                        <button class="delete-subscriber" onclick="deleteSubscriber('${sub.id}')">🗑️ Delete</button>
                    </div>
                </div>
            `;
        });
    } else {
        subsDiv.innerHTML += '<p>No subscribers yet. Add one to receive processed data!</p>';
    }
    
    modal.classList.remove('hidden');
}

window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy. You can select and copy manually.');
    });
}

window.closeModal = function() {
    document.getElementById('pipelineModal').classList.add('hidden');
    currentPipelineId = null;
}

window.showAddSubscriber = function() {
    document.getElementById('subscriberModal').classList.remove('hidden');
}

window.closeSubscriberModal = function() {
    document.getElementById('subscriberModal').classList.add('hidden');
    document.getElementById('subscriberUrl').value = '';
}

window.addSubscriber = async function() {
    const url = document.getElementById('subscriberUrl').value;
    
    if (!url) {
        alert('Please enter a URL');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/subscribers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ pipelineId: currentPipelineId, url })
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }
        
        closeSubscriberModal();
        showPipelineDetails(currentPipelineId);
    } catch (error) {
        alert('Error adding subscriber: ' + error.message);
    }
}

window.deleteSubscriber = async function(subscriberId) {
    if (!confirm('Are you sure you want to delete this subscriber?')) return;
    
    try {
        const response = await fetch(`${API_URL}/subscribers/${subscriberId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete subscriber');
        
        showPipelineDetails(currentPipelineId);
    } catch (error) {
        alert('Error deleting subscriber: ' + error.message);
    }
}

window.editSubscriber = async function(subscriberId, currentUrl) {
    const modalHtml = `
        <div id="editSubscriberModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; justify-content: center; align-items: center;">
            <div style="background: white; border-radius: 12px; max-width: 500px; width: 90%; padding: 24px;">
                <h2>✏️ Edit Subscriber</h2>
                <form id="editSubscriberForm">
                    <div class="form-group">
                        <label>Webhook URL</label>
                        <input type="url" id="editSubscriberUrl" value="${escapeHtml(currentUrl)}" required placeholder="https://example.com/webhook">
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button type="submit" style="flex: 1; padding: 10px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">Save Changes</button>
                        <button type="button" onclick="document.getElementById('editSubscriberModal').remove()" style="flex: 1; padding: 10px; background: #f5f5f5; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    document.getElementById('editSubscriberForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newUrl = document.getElementById('editSubscriberUrl').value;
        
        try {
            const response = await fetch(`${API_URL}/subscribers/${subscriberId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ url: newUrl })
            });
            
            if (!response.ok) throw new Error('Failed to update subscriber');
            
            alert('✅ Subscriber updated successfully!');
            document.getElementById('editSubscriberModal').remove();
            showPipelineDetails(currentPipelineId);
        } catch (error) {
            alert('Error updating subscriber: ' + error.message);
        }
    });
};

async function loadPipelinesForTester() {
    try {
        const response = await fetch(`${API_URL}/pipelines`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load pipelines');
        
        const pipelines = await response.json();
        const select = document.getElementById('testPipelineSelect');
        
        select.innerHTML = '<option value="">-- Select a pipeline --</option>' +
            pipelines.map(p => `<option value="${p.id}" data-secret="${p.secret}" data-name="${p.name}">${p.name}</option>`).join('');
    } catch (error) {
        console.error('Error loading pipelines for tester:', error);
    }
}

async function loadPipelinesForChaining() {
    try {
        const response = await fetch(`${API_URL}/pipelines`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load pipelines');
        
        const pipelines = await response.json();
        const select = document.getElementById('nextPipelineId');
        
        select.innerHTML = '<option value="">-- No chaining --</option>' +
            pipelines.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    } catch (error) {
        console.error('Error loading pipelines for chaining:', error);
    }
}

window.handlePipelineSelect = async function() {
    const select = document.getElementById('testPipelineSelect');
    const pipelineId = select.value;
    
    if (!pipelineId) {
        document.getElementById('testPipelineSecret').value = '';
        document.getElementById('testWebhookUrl').value = '';
        const emailFormContainer = document.getElementById('emailFormContainer');
        const cvFormContainer = document.getElementById('cvFormContainer');
        if (emailFormContainer) emailFormContainer.classList.add('hidden');
        if (cvFormContainer) cvFormContainer.classList.add('hidden');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/pipelines/${pipelineId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load pipeline');
        
        const pipeline = await response.json();
        
        document.getElementById('testPipelineSecret').value = pipeline.secret || '';
        document.getElementById('testWebhookUrl').value = `${API_URL}/webhooks/${pipelineId}`;
        
        const emailFormContainer = document.getElementById('emailFormContainer');
        const cvFormContainer = document.getElementById('cvFormContainer');
        
        if (pipeline.actionType === 'email') {
            if (emailFormContainer) emailFormContainer.classList.remove('hidden');
            if (cvFormContainer) cvFormContainer.classList.add('hidden');
            if (typeof updateEmailPreviewField === 'function') updateEmailPreviewField();
        } 
        else if (pipeline.actionType === 'pdf_generator') {
            if (emailFormContainer) emailFormContainer.classList.add('hidden');
            if (cvFormContainer) cvFormContainer.classList.remove('hidden');
        }
        else {
            if (emailFormContainer) emailFormContainer.classList.add('hidden');
            if (cvFormContainer) cvFormContainer.classList.add('hidden');
        }
        
    } catch (error) {
        console.error('Error loading pipeline:', error);
        alert('Failed to load pipeline details');
    }
};

window.copyWebhookUrl = function() {
    const url = document.getElementById('testWebhookUrl').value;
    if (url) {
        navigator.clipboard.writeText(url);
        alert('Webhook URL copied to clipboard!');
    }
}

window.copySignature = function() {
    const signature = document.getElementById('generatedSignature').innerText;
    if (signature && signature !== '-- Will be generated when you click test --') {
        navigator.clipboard.writeText(signature);
        alert('Signature copied to clipboard!');
    } else {
        alert('Please generate a signature first');
    }
}

async function calculateSignature(secret, payload) {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret);
    const payloadString = JSON.stringify(payload);
    
    const key = await crypto.subtle.importKey(
        'raw',
        secretKey,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(payloadString)
    );
    
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

window.calculateSignatureOnly = async function() {
    const select = document.getElementById('testPipelineSelect');
    const pipelineId = select.value;
    const secret = document.getElementById('testPipelineSecret').value;
    const payloadText = document.getElementById('testPayload').value;
    
    if (!pipelineId) {
        alert('Please select a pipeline');
        return;
    }
    
    if (!secret) {
        alert('Pipeline secret not found');
        return;
    }
    
    if (!payloadText) {
        alert('Please enter a payload');
        return;
    }
    
    try {
        const payload = JSON.parse(payloadText);
        const signature = await calculateSignature(secret, payload);
        
        document.getElementById('generatedSignature').innerHTML = signature;
        
        const resultDiv = document.getElementById('testResult');
        const resultMessage = document.getElementById('resultMessage');
        const resultDetails = document.getElementById('resultDetails');
        
        resultDiv.classList.remove('hidden', 'success', 'error', 'pending');
        resultDiv.classList.add('success');
        resultMessage.innerHTML = '✅ Signature calculated successfully!';
        resultDetails.innerHTML = `SHA-256 HMAC signature generated.<br><strong>Copy the signature above and use it in x-signature header.</strong>`;
        
        setTimeout(() => {
            resultDiv.classList.add('hidden');
        }, 5000);
    } catch (error) {
        alert('Invalid JSON payload: ' + error.message);
    }
}

window.generateAndSendWebhook = async function() {
    const select = document.getElementById('testPipelineSelect');
    const pipelineId = select.value;
    const secret = document.getElementById('testPipelineSecret').value;
    let payloadText = document.getElementById('testPayload').value;
    const emailFormContainer = document.getElementById('emailFormContainer');
    
    if (!pipelineId) {
        alert('Please select a pipeline');
        return;
    }
    
    if (!secret) {
        alert('Pipeline secret not found');
        return;
    }
    
    const isEmailPipeline = emailFormContainer && !emailFormContainer.classList.contains('hidden');
    
    let payload = {};
    
    if (payloadText.trim()) {
        try {
            payload = JSON.parse(payloadText);
        } catch (e) {
            alert('Invalid JSON payload');
            return;
        }
    }
    
    if (isEmailPipeline) {
        const to = document.getElementById('emailToField')?.value?.trim();
        const subject = document.getElementById('emailSubjectField')?.value?.trim();
        const body = document.getElementById('emailBodyField')?.value?.trim();
        
        if (!to) {
            alert('Please enter recipient email');
            return;
        }
        
        payload = {
            ...payload,
            to: to,
            subject: subject || '',
            body: body || ''
        };
    }
    
    const resultDiv = document.getElementById('testResult');
    const resultMessage = document.getElementById('resultMessage');
    const resultDetails = document.getElementById('resultDetails');
    
    if (resultDiv) {
        resultDiv.classList.remove('hidden', 'success', 'error');
        resultDiv.classList.add('pending');
        if (resultMessage) resultMessage.innerHTML = '⏳ Sending webhook...';
        if (resultDetails) resultDetails.innerHTML = '<div class="loading-spinner"></div>';
    }
    
    try {
        const signature = await calculateSignature(secret, payload);
        const signatureElement = document.getElementById('generatedSignature');
        if (signatureElement) signatureElement.innerHTML = signature;
        
        const response = await fetch(`${API_URL}/webhooks/${pipelineId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-signature': signature
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (response.ok && resultDiv) {
            resultDiv.classList.remove('pending');
            resultDiv.classList.add('success');
            if (resultMessage) resultMessage.innerHTML = '✅ Webhook sent successfully!';
            if (resultDetails) {
                resultDetails.innerHTML = `
                    <strong>Job ID:</strong> ${data.job.id}<br>
                    <strong>Status:</strong> ${data.job.status}<br>
                    <strong>Created:</strong> ${new Date(data.job.createdAt).toLocaleString()}<br>
                    ${isEmailPipeline ? `<strong>Email sent to:</strong> ${payload.to || 'N/A'}<br>` : ''}
                    <strong>Signature used:</strong> ${signature.substring(0, 32)}...
                `;
            }
            loadJobs();
        } else {
            throw new Error(data.message || 'Failed to send webhook');
        }
    } catch (error) {
        if (resultDiv) {
            resultDiv.classList.remove('pending');
            resultDiv.classList.add('error');
            if (resultMessage) resultMessage.innerHTML = '❌ Failed to send webhook';
            if (resultDetails) {
                resultDetails.innerHTML = `
                    <strong>Error:</strong> ${error.message}<br>
                    ${error.stack ? `<details><summary>Details</summary><pre>${error.stack}</pre></details>` : ''}
                `;
            }
        }
    }
    
    setTimeout(() => {
        if (resultDiv && !resultDiv.classList.contains('pending')) {
            resultDiv.classList.add('hidden');
        }
    }, 10000);
};

window.setPresetPayload = function(type) {
    const presets = {
        user: {
            name: "John Doe",
            email: "john@example.com",
            age: 30,
            city: "New York",
            role: "developer"
        },
        order: {
            orderId: "ORD-12345",
            customer: "Jane Smith",
            amount: 299.99,
            currency: "USD",
            items: ["laptop", "mouse"],
            status: "pending"
        },
        event: {
            eventType: "user_signup",
            userId: "user_789",
            timestamp: new Date().toISOString(),
            metadata: {
                source: "web",
                browser: "Chrome"
            }
        }
    };
    
    const payload = presets[type];
    if (payload) {
        document.getElementById('testPayload').value = JSON.stringify(payload, null, 2);
        updateEmailPreviewField();
    }
}

window.clearWebhookForm = function() {
    document.getElementById('testPipelineSelect').value = '';
    document.getElementById('testPipelineSecret').value = '';
    document.getElementById('testWebhookUrl').value = '';
    document.getElementById('testPayload').value = '';
    document.getElementById('generatedSignature').innerHTML = '-- Will be generated when you click test --';
    document.getElementById('testResult').classList.add('hidden');
    
    const emailToField = document.getElementById('emailToField');
    const emailSubjectField = document.getElementById('emailSubjectField');
    const emailBodyField = document.getElementById('emailBodyField');
    if (emailToField) emailToField.value = '';
    if (emailSubjectField) emailSubjectField.value = '';
    if (emailBodyField) emailBodyField.value = '';
    
    const emailFormContainer = document.getElementById('emailFormContainer');
    if (emailFormContainer) emailFormContainer.classList.add('hidden');
    
    updateEmailPreviewField();
};

window.loadEmailForm = async function() {
    const select = document.getElementById('testPipelineSelect');
    const pipelineId = select.value;
    const emailFormContainer = document.getElementById('emailFormContainer');
    
    if (!emailFormContainer) {
        return;
    }
    
    if (!pipelineId) {
        emailFormContainer.classList.add('hidden');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/pipelines/${pipelineId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load pipeline details');
        }
        
        const pipeline = await response.json();
        
        if (pipeline.actionType === 'email') {
            emailFormContainer.classList.remove('hidden');
            updateEmailPreviewField();
        } else {
            emailFormContainer.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error loading pipeline:', error);
        if (emailFormContainer) emailFormContainer.classList.add('hidden');
    }
};

function updateEmailPreviewField() {
    const to = document.getElementById('emailToField')?.value || '';
    const subject = document.getElementById('emailSubjectField')?.value || '';
    const body = document.getElementById('emailBodyField')?.value || '';
    const payloadText = document.getElementById('testPayload')?.value || '{}';
    const previewDiv = document.getElementById('emailPreviewField');
    
    if (!previewDiv) return;
    
    if (!to) {
        previewDiv.innerHTML = '⚠️ Please enter recipient email';
        return;
    }
    
    try {
        const payload = JSON.parse(payloadText);
        
        let previewBody = body || 'No custom message (auto-generated content will be used)';
        
        previewBody = previewBody.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return payload[key] !== undefined ? payload[key] : match;
        });
        
        previewDiv.innerHTML = `
            <div style="border: 1px solid #ddd; border-radius: 5px; padding: 10px;">
                <strong>📧 Email Preview:</strong><br>
                <strong>To:</strong> ${escapeHtml(to)}<br>
                <strong>Subject:</strong> ${escapeHtml(subject) || '(Auto-generated)'}<br>
                <strong>Body:</strong><br>
                <div style="background: white; padding: 8px; margin-top: 5px; border-radius: 3px; max-height: 100px; overflow-y: auto;">
                    ${previewBody}
                </div>
                ${Object.keys(payload).length > 0 ? '<small style="color: #666;">📦 Payload data available for variables</small>' : ''}
            </div>
        `;
    } catch (e) {
        previewDiv.innerHTML = '❌ Invalid JSON payload';
    }
}

function setupEmailPreviewListeners() {
    const emailToField = document.getElementById('emailToField');
    const emailSubjectField = document.getElementById('emailSubjectField');
    const emailBodyField = document.getElementById('emailBodyField');
    const testPayload = document.getElementById('testPayload');
    
    if (emailToField) emailToField.addEventListener('input', updateEmailPreviewField);
    if (emailSubjectField) emailSubjectField.addEventListener('input', updateEmailPreviewField);
    if (emailBodyField) emailBodyField.addEventListener('input', updateEmailPreviewField);
    if (testPayload) testPayload.addEventListener('input', updateEmailPreviewField);
}

async function loadJobs() {
    try {
        const response = await fetch(`${API_URL}/jobs`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load jobs');
        
        const jobs = await response.json();
        displayJobs(jobs);
    } catch (error) {
        console.error('Error loading jobs:', error);
        document.getElementById('jobsList').innerHTML = '<p style="color: white;">Error loading jobs. Make sure backend is running on port 5000.</p>';
    }
}

function displayJobs(jobs) {
    const container = document.getElementById('jobsList');
    
    if (!jobs || jobs.length === 0) {
        container.innerHTML = '<p style="color: white;">No jobs yet. Send some webhooks!</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="jobs-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${jobs.map(job => `
                    <tr>
                        <td><code>${job.id.substring(0, 8)}...</code></td>
                        <td><span class="status-badge status-${job.status}">${job.status}</span></td>
                        <td>${new Date(job.createdAt).toLocaleString()}</td>
                        <td>
                            <button class="btn-primary" onclick="viewJobDetails('${job.id}')" style="padding: 0.3rem 0.8rem; margin-right: 5px;">👁️ View</button>
                            ${job.status === 'failed' ? `<button class="btn-primary" onclick="retryJob('${job.id}')" style="padding: 0.3rem 0.8rem; margin-right: 5px; background: #ff9800;">🔄 Retry</button>` : ''}
                            <button class="delete-pipeline" onclick="deleteJob('${job.id}', '${job.status}')" style="padding: 0.3rem 0.8rem;">🗑️ Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

window.viewJobDetails = async function(jobId) {
    try {
        const response = await fetch(`${API_URL}/jobs/${jobId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to load job details: ${errorText}`);
        }
        
        const data = await response.json();
        
        let deliveriesText = '';
        if (data.deliveries && data.deliveries.length > 0) {
            deliveriesText = data.deliveries.map((d, index) => {
                const statusEmoji = d.status === 'success' ? '✅' : '❌';
                const date = d.lastAttemptAt ? new Date(d.lastAttemptAt).toLocaleString() : 'N/A';
                return `${index + 1}. ${statusEmoji} ${d.status.toUpperCase()}\n   └─ Attempts: ${d.attempts}\n   └─ Time: ${date}\n   └─ Error: ${d.lastError || 'None'}`;
            }).join('\n\n');
        } else {
            deliveriesText = '📭 No deliveries recorded for this job';
        }
        
        const modalHtml = `
            <div id="jobDetailsModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; justify-content: center; align-items: center;">
                <div style="background: white; border-radius: 12px; max-width: 800px; width: 90%; max-height: 80vh; overflow-y: auto; padding: 24px; font-family: monospace;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin: 0;">📋 Job Details</h2>
                        <button onclick="document.getElementById('jobDetailsModal').remove()" style="background: #f44336; color: white; border: none; border-radius: 5px; padding: 5px 10px; cursor: pointer;">✖ Close</button>
                    </div>
                    
                    <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                        <strong>ID:</strong> ${data.job.id}<br>
                        <strong>Status:</strong> <span style="color: ${data.job.status === 'completed' ? '#4caf50' : data.job.status === 'failed' ? '#f44336' : '#ff9800'}">${data.job.status}</span><br>
                        <strong>Created:</strong> ${new Date(data.job.createdAt).toLocaleString()}<br>
                        <strong>Updated:</strong> ${data.job.updatedAt ? new Date(data.job.updatedAt).toLocaleString() : 'N/A'}<br>
                        <strong>Attempts:</strong> ${data.job.attempts || 0}
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <h3>📦 Payload</h3>
                        <pre style="background: #f5f5f5; padding: 12px; border-radius: 8px; overflow-x: auto;">${JSON.stringify(data.job.payload, null, 2)}</pre>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <h3>✨ Result</h3>
                        <pre style="background: #f5f5f5; padding: 12px; border-radius: 8px; overflow-x: auto;">${JSON.stringify(data.job.result, null, 2) || 'No result yet'}</pre>
                    </div>
                    
                    <div>
                        <h3>📬 Deliveries</h3>
                        <pre style="background: #f5f5f5; padding: 12px; border-radius: 8px; overflow-x: auto; white-space: pre-wrap;">${deliveriesText}</pre>
                    </div>
                </div>
            </div>
        `;
        
        const existingModal = document.getElementById('jobDetailsModal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
    } catch (error) {
        console.error('Error loading job details:', error);
        alert('Error loading job details: ' + error.message);
    }
};

window.deleteJob = async function(jobId, jobStatus) {
    if (jobStatus === 'processing') {
        if (!confirm(`⚠️ This job is currently PROCESSING.\n\nDeleting it may cause inconsistent state.\n\nAre you sure you want to delete it?`)) {
            return;
        }
    } else {
        if (!confirm(`Are you sure you want to delete this job?\n\nThis action cannot be undone.`)) {
            return;
        }
    }
    
    try {
        const response = await fetch(`${API_URL}/jobs/${jobId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete job');
        
        alert('✅ Job deleted successfully!');
        loadJobs();
    } catch (error) {
        alert('Error deleting job: ' + error.message);
    }
};

window.retryJob = async function(jobId) {
    if (!confirm(`Retry this failed job?\n\nThis will create a new job with the same payload.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/jobs/${jobId}/retry`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to retry job');
        
        alert('✅ Job retry initiated!');
        loadJobs();
    } catch (error) {
        alert('Error retrying job: ' + error.message);
    }
};

document.getElementById('createPipelineForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('pipelineName').value;
    const actionType = document.getElementById('actionType').value;
    const nextPipelineId = document.getElementById('nextPipelineId').value || null;
    let actionConfig = {};
    
    if (actionType === 'transform') {
        const renameConfig = document.getElementById('transformConfigInput').value;
        const uppercase = document.getElementById('transformUppercase').value === 'true';
        
        actionConfig = {};
        
        if (renameConfig && renameConfig.trim()) {
            try {
                const rename = JSON.parse(renameConfig);
                actionConfig.rename = rename;
            } catch (e) {
                alert('Invalid JSON for rename config. Example: {"name": "fullName"}');
                return;
            }
        }
        
        if (uppercase) {
            actionConfig.transform = 'uppercase';
        }
        
        if (Object.keys(actionConfig).length === 0) {
            alert('⚠️ No transform configuration provided. The pipeline will return the original payload without changes.\n\nYou can add rename rules or select uppercase transformation.');
        }
        
    } else if (actionType === 'filter') {
        const field = document.getElementById('filterField').value;
        const operator = document.getElementById('filterOperator').value;
        const value = document.getElementById('filterValue').value;
        
        if (field && operator && value) {
            actionConfig = { field, operator, value };
        } else {
            alert('Please fill all filter fields');
            return;
        }
    } else if (actionType === 'enrich') {
        actionConfig = {};
    } else if (actionType === 'email') {
        actionConfig = {};
    } else if (actionType === 'validate_json') {
        const requiredFields = document.getElementById('validateRequiredFields').value;
        const fieldTypes = document.getElementById('validateFieldTypes').value;
        const enumFields = document.getElementById('validateEnumFields').value;
        
        actionConfig = {};
        if (requiredFields) actionConfig.requiredFields = JSON.parse(requiredFields);
        if (fieldTypes) actionConfig.fieldTypes = JSON.parse(fieldTypes);
        if (enumFields) actionConfig.enumFields = JSON.parse(enumFields);
    } else if (actionType === 'replace_text') {
        const replacementsText = document.getElementById('replaceReplacements').value;
        
        actionConfig = {};
        if (replacementsText && replacementsText.trim()) {
            try {
                const replacements = JSON.parse(replacementsText);
                if (!Array.isArray(replacements)) {
                    throw new Error('Replacements must be an array');
                }
                actionConfig.replacements = replacements;
            } catch (e) {
                alert('Invalid JSON for replacements. Example: [{"find": "old", "replace": "new"}]');
                return;
            }
        } else {
            alert('Please enter replacements configuration');
            return;
        }
    } else if (actionType === 'pdf_generator') {
        const template = document.getElementById('pdfTemplate').value;
        const output = document.getElementById('pdfOutput').value;
        const outputPath = document.getElementById('pdfOutputPath').value;
        const filename = document.getElementById('pdfFilename').value;
        
        actionConfig = {
            template,
            output
        };
        
        if (output === 'file' || output === 'both') {
            actionConfig.outputPath = outputPath || './output/cvs/';
        }
        
        if (filename) {
            actionConfig.filename = filename;
        }
    }
    
    try {
        const response = await fetch(`${API_URL}/pipelines`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ name, actionType, actionConfig, nextPipelineId })
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }
        
        const pipeline = await response.json();
        
        let configSummary = '';
        if (actionType === 'transform') {
            if (actionConfig.rename) {
                configSummary += `\n📝 Rename rules: ${JSON.stringify(actionConfig.rename)}`;
            }
            if (actionConfig.transform === 'uppercase') {
                configSummary += `\n🔠 Uppercase transformation: Enabled`;
            }
            if (!actionConfig.rename && actionConfig.transform !== 'uppercase') {
                configSummary += `\n⚠️ No transformation rules - payload will pass through unchanged`;
            }
        } else if (actionType === 'filter') {
            configSummary += `\n🎯 Filter: ${actionConfig.field} ${actionConfig.operator} ${actionConfig.value}`;
        } else if (actionType === 'enrich') {
            configSummary += `\n✨ Enrich: Adds timestamp and source metadata`;
        } else if (actionType === 'email') {
            configSummary += `\n📧 Email: Send email notifications (configure in Webhook Tester)`;
        }
        
        alert(`✅ Pipeline created successfully!\n\nName: ${pipeline.name}\nAction: ${actionType}${configSummary}\n\nWebhook URL: ${API_URL}/webhooks/${pipeline.id}\nSecret: ${pipeline.secret.substring(0, 16)}...`);
        
        document.getElementById('createPipelineForm').reset();
        document.querySelectorAll('.action-config').forEach(el => el.classList.add('hidden'));
        showSection('pipelines');
        loadPipelines();
        loadPipelinesForTester();
        loadPipelinesForChaining();
    } catch (error) {
        alert('Error creating pipeline: ' + error.message);
    }
});

document.getElementById('actionType').addEventListener('change', (e) => {
    const type = e.target.value;
    
    document.querySelectorAll('.action-config').forEach(el => {
        el.classList.add('hidden');
    });
    
    if (type === 'transform') {
        document.getElementById('transformConfig').classList.remove('hidden');
    } else if (type === 'filter') {
        document.getElementById('filterConfig').classList.remove('hidden');
    } else if (type === 'enrich') {
        document.getElementById('enrichConfig').classList.remove('hidden');
    } else if (type === 'validate_json') {
        document.getElementById('validateJsonConfig').classList.remove('hidden');
    } else if (type === 'replace_text') {
        document.getElementById('replaceTextConfig').classList.remove('hidden');
    } else if (type === 'pdf_generator') {
        document.getElementById('pdfGeneratorConfig').classList.remove('hidden');
        toggleOutputPath();
    }
});

function toggleOutputPath() {
    const output = document.getElementById('pdfOutput').value;
    const outputPathGroup = document.getElementById('pdfOutputPathGroup');
    if (output === 'file' || output === 'both') {
        outputPathGroup.style.display = 'block';
    } else {
        outputPathGroup.style.display = 'none';
    }
}

document.getElementById('pdfOutput').addEventListener('change', toggleOutputPath);

function addExperience() {
    const experienceList = document.getElementById('experienceList');
    if (!experienceList) return;
    
    const newExp = document.createElement('div');
    newExp.className = 'experience-item';
    newExp.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>Job Title</label>
                <input type="text" class="exp-title" placeholder="Senior Developer">
            </div>
            <div class="form-group">
                <label>Company</label>
                <input type="text" class="exp-company" placeholder="Tech Company">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Start Date</label>
                <input type="text" class="exp-start" placeholder="2022-01">
            </div>
            <div class="form-group">
                <label>End Date</label>
                <input type="text" class="exp-end" placeholder="Present">
            </div>
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea class="exp-desc" rows="2" placeholder="Developed APIs, managed databases..."></textarea>
        </div>
        <button type="button" class="remove-experience" onclick="this.closest('.experience-item').remove()">🗑️ Remove</button>
        <hr>
    `;
    experienceList.appendChild(newExp);
}

function addEducation() {
    const educationList = document.getElementById('educationList');
    if (!educationList) return;
    
    const newEdu = document.createElement('div');
    newEdu.className = 'education-item';
    newEdu.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>Degree</label>
                <input type="text" class="edu-degree" placeholder="Bachelor in Computer Science">
            </div>
            <div class="form-group">
                <label>Institution</label>
                <input type="text" class="edu-institution" placeholder="University of Jordan">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Year</label>
                <input type="text" class="edu-year" placeholder="2020">
            </div>
        </div>
        <button type="button" class="remove-education" onclick="this.closest('.education-item').remove()">🗑️ Remove</button>
        <hr>
    `;
    educationList.appendChild(newEdu);
}

function addSkill(button) {
    const input = button.previousElementSibling;
    const skill = input.value.trim();
    if (skill && !skillsArray.includes(skill)) {
        skillsArray.push(skill);
        updateSkillsDisplay();
        input.value = '';
    }
}

function removeSkill(skill) {
    skillsArray = skillsArray.filter(s => s !== skill);
    updateSkillsDisplay();
}

function updateSkillsDisplay() {
    const skillsList = document.getElementById('skillsList');
    if (!skillsList) return;
    
    skillsList.innerHTML = skillsArray.map(skill => `
        <span class="skill-tag-item">
            ${escapeHtml(skill)}
            <button onclick="removeSkill('${skill.replace(/'/g, "\\'")}')">✖</button>
        </span>
    `).join('');
}

function buildCVPayload() {
    const personal = {
        fullName: document.getElementById('cvFullName')?.value || '',
        email: document.getElementById('cvEmail')?.value || '',
        phone: document.getElementById('cvPhone')?.value || '',
        location: document.getElementById('cvLocation')?.value || '',
        linkedin: document.getElementById('cvLinkedin')?.value || '',
        github: document.getElementById('cvGithub')?.value || '',
        summary: document.getElementById('cvSummary')?.value || ''
    };
    
    if (!personal.fullName || !personal.email) {
        alert('Please fill in Full Name and Email (required fields)');
        return;
    }
    
    const experience = [];
    document.querySelectorAll('.experience-item').forEach(item => {
        const title = item.querySelector('.exp-title')?.value;
        const company = item.querySelector('.exp-company')?.value;
        const startDate = item.querySelector('.exp-start')?.value;
        const endDate = item.querySelector('.exp-end')?.value;
        const description = item.querySelector('.exp-desc')?.value;
        
        if (title && company) {
            experience.push({ title, company, startDate, endDate, description });
        }
    });
    
    const education = [];
    document.querySelectorAll('.education-item').forEach(item => {
        const degree = item.querySelector('.edu-degree')?.value;
        const institution = item.querySelector('.edu-institution')?.value;
        const year = item.querySelector('.edu-year')?.value;
        
        if (degree && institution) {
            education.push({ degree, institution, year });
        }
    });
    
    const payload = {
        personal,
        experience,
        education,
        skills: skillsArray
    };
    
    const testPayload = document.getElementById('testPayload');
    if (testPayload) {
        testPayload.value = JSON.stringify(payload, null, 2);
    }
    
    if (typeof updateEmailPreviewField === 'function') {
        updateEmailPreviewField();
    }
    
    alert('✅ CV data has been built! You can now send the webhook.');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupEmailPreviewListeners);
} else {
    setupEmailPreviewListeners();
}

const style = document.createElement('style');
style.textContent = `
    .cv-form-container {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        border: 2px solid #667eea;
        animation: slideDown 0.3s ease;
    }
    .cv-form-container h3 {
        color: #667eea;
        margin-bottom: 1rem;
        font-size: 1.2rem;
    }
    .form-section {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
    }
    .form-section h4 {
        color: #495057;
        margin-bottom: 1rem;
        font-size: 1rem;
    }
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
    .experience-item, .education-item {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        border: 1px solid #e0e0e0;
    }
    .add-btn {
        background: #667eea;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
    }
    .remove-experience, .remove-education {
        background: #f44336;
        color: white;
        border: none;
        padding: 0.3rem 0.8rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.75rem;
        margin-top: 0.5rem;
    }
    .skills-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }
    .skill-tag-item {
        background: #667eea;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8rem;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
    }
    .skill-tag-item button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 0.8rem;
    }
    .build-cv-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 600;
        width: 100%;
        margin-top: 1rem;
    }
    .build-cv-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    .skills-input-group {
        display: flex;
        gap: 0.5rem;
    }
    .skill-input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 6px;
    }
    .add-skill-btn {
        background: #28a745;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
    }
`;
document.head.appendChild(style);