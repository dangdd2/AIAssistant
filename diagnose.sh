#!/bin/bash

echo "🔍 Ollama Diagnostics"
echo "===================="
echo ""

# Check if Ollama is running
echo "1️⃣  Checking if Ollama is running..."
if curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
    echo "   ✅ Ollama is running"
    VERSION=$(curl -s http://localhost:11434/api/version)
    echo "   Version: $VERSION"
else
    echo "   ❌ Ollama is NOT running"
    echo "   → Start it with: ollama serve"
    exit 1
fi

echo ""

# List available models
echo "2️⃣  Checking available models..."
MODELS=$(curl -s http://localhost:11434/api/tags | python3 -c "import sys, json; data = json.load(sys.stdin); print('\n'.join([m['name'] for m in data.get('models', [])]))" 2>/dev/null)

if [ -z "$MODELS" ]; then
    echo "   ❌ No models found or API error"
    echo "   → Try: curl http://localhost:11434/api/tags"
else
    echo "   ✅ Available models:"
    echo "$MODELS" | while read model; do
        echo "      - $model"
    done
fi

echo ""

# Check for kimi model specifically
echo "3️⃣  Checking for 'kimi-k2.5-cloud' model..."
if echo "$MODELS" | grep -q "kimi"; then
    echo "   ✅ Found kimi model"
    KIMI_MODEL=$(echo "$MODELS" | grep "kimi")
    echo "   Exact name: $KIMI_MODEL"
else
    echo "   ❌ 'kimi-k2.5-cloud' not found"
    echo "   → Available models are listed above"
    echo "   → Pull it with: ollama pull kimi-k2.5-cloud"
    echo "   → Or use a different model from the list"
fi

echo ""

# Test API endpoint
echo "4️⃣  Testing API endpoint..."
TEST_MODEL=$(echo "$MODELS" | head -n 1)
if [ ! -z "$TEST_MODEL" ]; then
    echo "   Testing with model: $TEST_MODEL"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:11434/api/chat \
        -H "Content-Type: application/json" \
        -d "{
            \"model\": \"$TEST_MODEL\",
            \"messages\": [{\"role\": \"user\", \"content\": \"Hi\"}],
            \"stream\": false
        }" 2>&1)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "   ✅ API is working!"
    else
        echo "   ❌ API returned status: $HTTP_CODE"
        echo "$RESPONSE"
    fi
fi

echo ""
echo "===================="
echo "🎯 RECOMMENDATIONS:"
echo ""

if ! echo "$MODELS" | grep -q "kimi"; then
    echo "⚠️  Your app is configured for 'kimi-k2.5-cloud' but it's not installed."
    echo ""
    echo "Option 1: Pull the kimi model"
    echo "   ollama pull kimi-k2.5-cloud"
    echo ""
    echo "Option 2: Use an existing model"
    if [ ! -z "$MODELS" ]; then
        FIRST_MODEL=$(echo "$MODELS" | head -n 1)
        echo "   Update your app settings to use: $FIRST_MODEL"
    fi
else
    echo "✅ Everything looks good!"
    echo "   If you're still getting 404 errors, check:"
    echo "   - Is the proxy running? (node proxy.js)"
    echo "   - Is the model name EXACTLY: $(echo "$MODELS" | grep "kimi")"
fi

echo ""
