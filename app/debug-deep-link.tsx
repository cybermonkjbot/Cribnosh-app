import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DebugDeepLink() {
  const router = useRouter();
  const [customTreatId, setCustomTreatId] = useState('test123');
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testDeepLink = async () => {
    // Always use custom scheme for deep links
    const deepLink = `cribnoshapp://treat/${customTreatId}`;
    const testUrl = deepLink;
    
    addResult(`Testing custom scheme deep link: ${deepLink}`);
    
    // Test if the URL can be opened
    try {
      const canOpen = await Linking.canOpenURL(testUrl);
      addResult(`Can open URL: ${canOpen}`);
      
      if (canOpen) {
        Linking.openURL(testUrl).then(() => {
          addResult('Link opened successfully');
        }).catch((error) => {
          addResult(`Link failed: ${error.message}`);
        });
      } else {
        addResult(`Cannot open URL - custom scheme may not be registered`);
        addResult(`This is normal in development mode`);
      }
    } catch (error) {
      addResult(`Error testing URL: ${error}`);
    }
  };

  const testWebLink = () => {
    const webLink = `https://cribnosh.com/treat/${customTreatId}`;
    addResult(`Testing web link: ${webLink}`);
    
    Linking.openURL(webLink).then(() => {
      addResult('Web link opened successfully');
    }).catch((error) => {
      addResult(`Web link failed: ${error.message}`);
    });
  };

  const simulateDeepLink = async () => {
    addResult(`Simulating deep link behavior for development`);
    addResult(`This would normally navigate to: /shared-link?treatId=${customTreatId}`);
    addResult(`Testing deep link handler directly...`);
    
    // Check if we're in development mode
    const initialUrl = await Linking.getInitialURL();
    const isDevelopment = initialUrl?.includes('exp://') || initialUrl?.includes('expo://');
    
    // Test both development and production URLs
    const devUrl = `exp://192.168.0.179:8081/treat/${customTreatId}`;
    const prodUrl = `cribnoshapp://treat/${customTreatId}`;
    const webUrl = `https://cribnosh.com/treat/${customTreatId}`;
    
    addResult(`Testing URLs:`);
    addResult(`Dev: ${devUrl}`);
    addResult(`Prod: ${prodUrl}`);
    addResult(`Web: ${webUrl}`);
    
    // Test URL parsing logic for each type
    const testUrls = [devUrl, prodUrl, webUrl];
    
    testUrls.forEach((url, index) => {
      const treatIdMatch = url.match(/(?:cribnoshapp:\/\/treat\/|https:\/\/cribnosh\.com\/treat\/|exp:\/\/[^\/]+\/treat\/)([^/?]+)/);
      const extractedTreatId = treatIdMatch ? treatIdMatch[1] : null;
      
      const urlType = index === 0 ? 'Dev' : index === 1 ? 'Prod' : 'Web';
      
      if (extractedTreatId) {
        addResult(`✅ ${urlType} URL: Successfully extracted treat ID: ${extractedTreatId}`);
      } else {
        addResult(`❌ ${urlType} URL: Failed to extract treat ID`);
      }
    });
    
    if (isDevelopment) {
      addResult(`💡 In development, use the dev URL for testing`);
      addResult(`💡 Copy the dev URL and paste in browser to test`);
    }
  };

  const testDirectNavigation = () => {
    addResult(`Testing direct navigation to shared-link dynamic route`);
    addResult(`Navigating to: /shared-link/${customTreatId}`);
    
    try {
      router.push(`/shared-link/${customTreatId}` as any);
      addResult(`✅ Direct navigation successful`);
    } catch (error) {
      addResult(`❌ Direct navigation failed: ${error}`);
    }
  };

  const testSimpleNavigation = () => {      
    addResult(`Testing simple navigation to shared-link dynamic route`);
    addResult(`Using router.navigate instead of router.push`);
    
    try {
      // Use the same method as the deep link handler
      router.navigate(`/shared-link/${customTreatId}` as any);
      addResult(`✅ Simple navigation successful`);
    } catch (error) {
      addResult(`❌ Simple navigation failed: ${error}`);
    }
  };

  const testDeepLinkHandler = async () => {
    addResult(`Testing deep link handler directly`);
    addResult(`Simulating deep link event...`);
    
    try {
      // Import the deep link handler
      const { handleDeepLink } = await import('../lib/deepLinkHandler');
      
      // Test with a simple URL
      const testUrl = `exp://192.168.0.179:8081/treat/${customTreatId}`;
      addResult(`Testing URL: ${testUrl}`);
      
      // Test URL parsing first
      const Linking = await import('expo-linking');
      try {
        const parsed = Linking.parse(testUrl);
        addResult(`✅ URL parsing successful: ${JSON.stringify(parsed)}`);
      } catch (parseError) {
        addResult(`❌ URL parsing failed: ${parseError}`);
      }
      
      // Manually trigger the handler
      handleDeepLink({ url: testUrl });
      addResult(`✅ Deep link handler triggered successfully`);
    } catch (error) {
      addResult(`❌ Deep link handler failed: ${error}`);
    }
  };

  const testAppState = async () => {
    try {
      const initialUrl = await Linking.getInitialURL();
      addResult(`Initial URL: ${initialUrl || 'None'}`);
      
      // Check if we're in development mode (Expo dev server)
      const isDevelopment = initialUrl?.includes('exp://') || initialUrl?.includes('expo://');
      addResult(`Development mode: ${isDevelopment}`);
      
      if (isDevelopment) {
        addResult(`⚠️ In development mode - deep links may not work as expected`);
        addResult(`Deep links work best in production builds or Expo Go app`);
      }
      
      const canOpen = await Linking.canOpenURL('cribnoshapp://treat/test');
      addResult(`Can open deep link: ${canOpen}`);
      
      const canOpenWeb = await Linking.canOpenURL('https://cribnosh.com/treat/test');
      addResult(`Can open web link: ${canOpenWeb}`);
      
      // Test with Expo development URL
      const canOpenExpo = await Linking.canOpenURL('exp://192.168.0.179:8081');
      addResult(`Can open Expo dev URL: ${canOpenExpo}`);
      
    } catch (error) {
      addResult(`App state test failed: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const copyLink = (type: 'prod' | 'web') => {
    let link: string;
    
    switch (type) {
      case 'prod':
        link = `cribnoshapp://treat/${customTreatId}`;
        break;
      case 'web':
        link = `https://cribnosh.com/treat/${customTreatId}`;
        break;
      default:
        link = '';
    }
    
    // Copy to clipboard (you might need to install expo-clipboard)
    navigator.clipboard?.writeText(link);
    addResult(`Copied ${type} link to clipboard: ${link}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Deep Link Debugger</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Treat ID:</Text>
          <TextInput
            style={styles.input}
            value={customTreatId}
            onChangeText={setCustomTreatId}
            placeholder="Enter treat ID"
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={testDeepLink}>
            <Text style={styles.buttonText}>Test Deep Link</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={testWebLink}>
            <Text style={styles.buttonText}>Test Web Link</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.simulateButton]} onPress={simulateDeepLink}>
            <Text style={styles.buttonText}>Simulate Deep Link</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.directButton]} onPress={testDirectNavigation}>
            <Text style={styles.buttonText}>Test Direct Navigation</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.simpleButton]} onPress={testSimpleNavigation}>
            <Text style={styles.buttonText}>Test Simple Navigation</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.handlerButton]} onPress={testDeepLinkHandler}>
            <Text style={styles.buttonText}>Test Deep Link Handler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={testAppState}>
            <Text style={styles.buttonText}>Check App State</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.linkContainer}>
          <Text style={styles.label}>Generated Links:</Text>
          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Deep Link: cribnoshapp://treat/{customTreatId}</Text>
            <TouchableOpacity onPress={() => copyLink('prod')}>
              <Text style={styles.copyText}>Copy</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Web Fallback: https://cribnosh.com/treat/{customTreatId}</Text>
            <TouchableOpacity onPress={() => copyLink('web')}>
              <Text style={styles.copyText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.label}>Test Results:</Text>
            <TouchableOpacity onPress={clearResults}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.results}>
            {testResults.map((result, index) => (
              <Text key={index} style={styles.resultText}>{result}</Text>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF3B30',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  simulateButton: {
    backgroundColor: '#F59E0B',
  },
  directButton: {
    backgroundColor: '#8B5CF6',
  },
  simpleButton: {
    backgroundColor: '#EF4444',
  },
  handlerButton: {
    backgroundColor: '#06B6D4',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
    flex: 1,
  },
  copyText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  results: {
    flex: 1,
  },
  resultText: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
