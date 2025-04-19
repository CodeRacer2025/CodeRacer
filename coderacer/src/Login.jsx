import React, { useEffect, useRef, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

const Login = () => {
  const navigate = useNavigate();
  const [typedCode, setTypedCode] = useState('');
  const [fullCode, setFullCode] = useState('');
  const terminalRef = useRef(null);

  const codeSnippets = [
    `function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}`,
    `function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    let key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
  return arr;
}`,
    `function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[0];
  const left = arr.slice(1).filter(x => x < pivot);
  const right = arr.slice(1).filter(x => x >= pivot);
  return [...quickSort(left), pivot, ...quickSort(right)];
}`
  ];

  useEffect(() => {
    let snippetIndex = 0;
    let charIndex = 0;

    const playNextSnippet = () => {
      const snippet = codeSnippets[snippetIndex];
      setTypedCode('');
      setFullCode(snippet);
      charIndex = 0;

      const typeChar = () => {
        if (charIndex <= snippet.length) {
          setTypedCode(snippet.slice(0, charIndex));
          charIndex++;
          setTimeout(typeChar, 20);
        } else {
          setTimeout(() => {
            snippetIndex = (snippetIndex + 1) % codeSnippets.length;
            playNextSnippet();
          }, 1500);
        }
      };

      typeChar();
    };

    playNextSnippet();
  }, []);

  const handleSuccess = (credentialResponse) => {
    if (credentialResponse.credential) {
      const decoded = jwtDecode(credentialResponse.credential);
      const userEmail = decoded.email;
      console.log('User Info:', userEmail);
      localStorage.setItem('userEmail', userEmail);
      navigate('/topics');
    }
  };

  const handleError = () => {
    console.log('Google Login Failed');
  };

  const renderHighlightedCode = () => {
    return fullCode.split('').map((char, index) => {
      const isTyped = index < typedCode.length;
      return (
        <span
          key={index}
          className={isTyped ? styles.highlightedChar : styles.untypedChar}
        >
          {char}
        </span>
      );
    });
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginTitle}>Welcome to Code Racer</div>
        <div className={styles.googleLoginButton}>
          <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
        </div>
        <div className={styles.codeSplitView}>
          <div className={styles.codeBox}>
            <pre>{typedCode}</pre>
          </div>
          <div className={styles.codeBox}>
            <pre>{renderHighlightedCode()}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
