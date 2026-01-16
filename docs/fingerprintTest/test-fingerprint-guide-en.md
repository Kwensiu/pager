# Fingerprint Spoofing Feature Test Guide

## Feature Overview

The fingerprint spoofing feature of the Pager application has been implemented and integrated into the WebView container. This feature supports three modes:

- **Basic Mode**: Only modify basic fingerprint information (screen resolution, timezone, language)
- **Balanced Mode**: Modify basic fingerprint + Canvas + hardware information (default mode)
- **Advanced Mode**: Fully modify all fingerprint information (including WebGL and audio fingerprint)

## Test Steps

### 1. Start the application and add a website

1. Start the Pager application
2. Add a new website (e.g., https://browserleaks.com/webgl)
3. Enable fingerprint spoofing in the website settings
4. Select different spoofing modes

### 2. Verify fingerprint spoofing effects

After opening the website in WebView, press F12 to open the developer tools and run the test script:

```javascript
// Load test script
fetch('file:///e:/System/Documents/GitHub/pager/test-fingerprint.js')
  .then((response) => response.text())
  .then((code) => eval(code))
  .catch(() => {
    // If unable to load the file, manually copy and paste the script content to the console
    console.log('Please manually copy the content of test-fingerprint.js to the console to run')
  })
```

### 3. Check the effects of different modes

#### Basic Mode Test

- ✅ User-Agent should be modified
- ✅ Screen resolution should be random
- ✅ Timezone should be random
- ✅ Language settings should be random combinations
- ❌ Canvas fingerprint should remain original
- ❌ WebGL fingerprint should remain original
- ❌ Hardware information should remain original

#### Balanced Mode Test

- ✅ Includes all features of the basic mode
- ✅ Canvas fingerprint should be modified
- ✅ Hardware information (CPU cores, memory, etc.) should be random
- ❌ WebGL fingerprint should remain original
- ❌ Audio fingerprint should remain original

#### Advanced Mode Test

- ✅ Includes all features of the balanced mode
- ✅ WebGL fingerprint should be modified
- ✅ Audio fingerprint should be modified

### 4. Verify fingerprint property protection

Check if the following properties are correctly protected (non-writable, non-configurable):

```javascript
// Check property descriptors
const userAgentDesc = Object.getOwnPropertyDescriptor(navigator, 'userAgent')
console.log('User-Agent writable:', userAgentDesc?.writable) // Should be false
console.log('User-Agent configurable:', userAgentDesc?.configurable) // Should be false
```

## Technical Implementation Details

### 1. Fingerprint Generation Service (`src/main/services/fingerprint.ts`)

- Using the `fingerprint-generator` library to generate basic fingerprints
- Adding different randomized parameters based on the mode
- Implementing fingerprint cache mechanism (24-hour validity)
- Supporting fingerprint refresh and cache cleanup

### 2. WebView Integration (`src/renderer/components/features/WebViewContainer.tsx`)

- Automatically applying fingerprint spoofing after DOM is ready
- Modifying browser properties through JavaScript injection
- Supporting website-level fingerprint settings

### 3. IPC Communication (`src/main/ipc/enhancedHandlers.ts`)

- Providing fingerprint generation, application, and refresh APIs
- Supporting cache statistics and management
- Error handling and fallback mechanisms

## Expected Results

### Success Indicators

1. **Fingerprint generation**: Different modes generate fingerprints of different complexity
2. **Property protection**: Modified properties cannot be detected as modified by websites
3. **Cache mechanism**: Reuse fingerprints for the same configuration to improve performance
4. **Website compatibility**: Fingerprint spoofing does not affect normal website functionality

### Common troubleshooting

1. **Fingerprint not applied**: Check if there are any error logs in the console
2. **Website functionality issues**: Try lowering the fingerprint spoofing mode (from advanced to balanced)
3. **Performance issues**: Check if the fingerprint cache is working properly

## Recommended Test Websites

- https://browserleaks.com/webgl - WebGL fingerprint detection
- https://fingerprintjs.github.io/fingerprintjs/ - Comprehensive fingerprint detection
- https://abrahamjuliot.github.io/creepjs/ - Detailed fingerprint analysis
- https://www.deviceinfo.me - Device information detection

## Notes

1. Fingerprint spoofing is mainly for JavaScript detection and cannot completely prevent network-level fingerprint tracking
2. Some websites may detect fingerprint inconsistencies, requiring a balance between privacy protection and functionality compatibility
3. It is recommended to choose the appropriate spoofing mode based on actual needs
