# Security Policy

## Supported Versions

As Somnium is currently in early development, security updates will be applied to the latest version only.

| Version | Supported          |
| ------- | ------------------ |
| 0.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously and appreciate your help in keeping Somnium safe. If you discover a security vulnerability, please follow these steps:

### 1. Do NOT Create a Public Issue

Security vulnerabilities should not be reported via GitHub issues as they are publicly visible.

### 2. Email Security Report

Send an email to: `security-somnium@example.com` (replace with actual security email)

Include the following information:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any suggested fixes (optional)

### 3. What to Expect

- **Acknowledgment**: We'll acknowledge receipt within 48 hours
- **Initial Assessment**: Within 5 business days, we'll provide an initial assessment
- **Updates**: We'll keep you informed about our progress
- **Fix Timeline**: We aim to fix critical vulnerabilities within 30 days
- **Credit**: With your permission, we'll credit you in our security acknowledgments

## Security Best Practices for Users

### API Key Security

1. **Never commit API keys** to the repository
2. **Use environment variables** or a `config.js` file (which should be gitignored)
3. **Rotate keys regularly** if you suspect they may be compromised
4. **Use read-only keys** where possible

### Browser Security

1. **Keep your browser updated** to the latest version
2. **Only run Somnium from trusted sources**
3. **Be cautious with save files** from unknown sources

### Content Security

1. The game includes **content moderation** to filter inappropriate AI responses
2. If you encounter inappropriate content that bypassed filters, please report it
3. Parents should supervise children playing online games

## Security Features

### Built-in Protections

- **Content Moderation**: AI responses are filtered for inappropriate content
- **Input Sanitization**: User input is sanitized to prevent injection attacks
- **Local Storage Only**: Save files are stored locally, not transmitted
- **No User Accounts**: No personal information is collected or stored

### Planned Security Enhancements

- [ ] API key proxy server to hide keys from client
- [ ] Enhanced content filtering with multiple providers
- [ ] Sandboxed script execution for game logic
- [ ] Save file integrity verification

## Known Security Considerations

### Client-Side API Keys

Currently, API keys are used client-side. This is a known limitation during development. For production:

- Consider using a proxy server
- Implement rate limiting
- Use restricted API keys with limited permissions

### User-Generated Content

Since the game generates content via AI:

- Content moderation is probabilistic, not guaranteed
- Users should report inappropriate content
- Parents should monitor children's gameplay

### Save File Security

Save files contain the entire game state:

- Don't load save files from untrusted sources
- Save files could potentially contain inappropriate content that bypassed initial filters
- Future versions will include save file validation

## Scope

### In Scope

The following are considered security issues:

- API key exposure in code
- Cross-site scripting (XSS) vulnerabilities
- Injection attacks via user input
- Content moderation bypasses
- Save file exploits
- Denial of service vulnerabilities

### Out of Scope

The following are not considered security issues:

- Issues in outdated browsers not meeting our minimum requirements
- Social engineering attacks
- Physical access attacks
- Issues requiring already compromised systems
- Theoretical vulnerabilities without practical exploit

## Bug Bounty

As an open-source project in early development, we don't currently offer monetary rewards. However, we will:

- Publicly acknowledge security researchers (with permission)
- Provide detailed credits in our release notes
- Add your name to our Security Hall of Fame (coming soon)

## Security Hall of Fame

We'll maintain a list of security researchers who have helped improve Somnium's security. If you report a valid security issue, you'll be added here (with your permission).

---

Thank you for helping keep Somnium secure!
