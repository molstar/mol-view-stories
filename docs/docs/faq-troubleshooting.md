# FAQ & Troubleshooting

Find answers to common questions and solutions to typical issues when using MolViewStories.

## Frequently Asked Questions

### Getting Started

**Q: Do I need to download or install anything?**
A: No! MolViewStories runs entirely in your web browser. Just visit the website and start creating.

**Q: What browsers are supported?**
A: MolViewStories works on all modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, use the latest version of your preferred browser.

**Q: Do I need a login to use MolViewStories?**
A: You can explore and create stories without logging in. However, to save your work to the cloud and access it later, you'll need to sign in with your institutional credentials. Don't want to log-in? You work can be exported and imported locally as well.

**Q: Is MolViewStories free to use?**
A: Yes, MolViewStories is completely free for academic and educational use.

### File Formats and Data

**Q: What file formats can I upload?**
A: MolViewStories supports all file formats supported [MolViewSpec](https://molstar.org/mol-view-spec). Your favorite format isn't supported? Raise an issue on the [project's GitHub](https://github.com/molstar/mol-view-spec/)

**Q: Can I use my own experimental structures?**
A: Absolutely! Upload your own structure files using the "Assets" menu. This is perfect for unpublished structures or experimental data.

**Q: What's the file size limit?**
A: Individual story sessions can be up to 50 MB, and each user gets up to 100 sessions.

**Q: Can I load structures directly from databases?**
A: Yes! You can load structures directly from:
- Protein Data Bank (PDB)
- AlphaFold Database
- Any public URL containing structure files

### Creating Stories

**Q: How many scenes can I have in a story?**
A: There's no hard limit on the number of scenes, but for performance and user experience, we recommend keeping stories under 20 scenes.

**Q: Can I reorder scenes after creating them?**
A: Yes, use the "Scene" menu.

**Q: How do I copy a scene?**
A: Use "Scene -> Duplicate" or manually copy the code and description from one scene to another.

**Q: Can I include animations?**
A: Yes, you can animate almost any property of the state using `builder.animate()`.

### Sharing and Collaboration

**Q: How do I share my story with others?**
A: You have several options:
- **Publish** your story to get a public shareable link
- **Export as HTML** for offline viewing or manually shared stories
- **Download session file** to share the editable version

You can also host the story and session files anywhere with CORS enables and the link them directly to the `https://molstar.org/stories-viewer/v1/` (or `v?` depending on the current version of the app) using `?story-url`, `story-session-url` and `data-format` URL parameters. For example: `https://molstar.org/stories-viewer/v1/?story-url=https://path.to/state.mvsx&data-format=mvsx&story-session-url=https://path.to/session.mvstory`. A good place to store these files is your personal GitHub account and link it via `https://raw.githubusercontent.com/...`.

**Q: What's the difference between saving and publishing?**
A: 
- **Saving**: Creates a private session only you can access
- **Publishing**: Creates a public story with a shareable link that anyone can view

**Q: Can multiple people edit the same story?**
A: Not simultaneously. However, you can share session files for others to edit and send back, or publish stories that others can fork and modify.

**Q: How long do published stories stay available?**
A: Published stories remain available indefinitely as long as the MolViewStories service is running.

## Troubleshooting Guide

### Loading and Display Issues

**Problem: Structure won't load**

*Symptoms:* Empty 3D viewer, error messages, infinite loading

*Solutions:*
1. **Check the URL**: Copy the download URL into your browser to verify it works
2. **Verify PDB ID**: Ensure the PDB ID exists by searching on [rcsb.org](https://www.rcsb.org) or [pdbe.org](https://pdbe.org)
3. **Check file format**: Make sure the format parameter matches the actual file type
4. **Try a known working example**: Test with a simple structure like 1CBS

*Example fix:*
```javascript
// Instead of a potentially broken URL:
// .download({ url: 'broken-url' })

// Try a verified PDB entry:
.download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1cbs_updated.cif' })
.parse({ format: 'mmcif' })
```

**Problem: Scene appears empty or blank**

*Symptoms:* 3D viewer shows nothing, but no error messages

*Solutions:*
1. **Click "Update Scene"**: Make sure you've applied your latest code changes
2. **Check selectors**: Verify your component selectors match actual residues in the structure
3. **Simplify the code**: Start with basic representation and add complexity gradually
4. **Reset camera**: Try adding `.focus({})` on a `.component()` to center the view

*Example debugging:*
```javascript
// Start simple and build up
const structure = builder
  .download({ url: 'your-url' })
  .parse({ format: 'mmcif' })
  .modelStructure({});

// Just show everything first
structure.component({}).representation({});
```

**Problem: Code editor shows errors**

*Symptoms:* Red underlines, error messages, autocomplete not working

*Solutions:*
1. **Check syntax**: Look for missing brackets, quotes, or semicolons
2. **Verify method names**: Use autocomplete (Ctrl+Space) to ensure correct spelling
3. **Check browser console**: Press F12 and look for detailed error messages
4. **Start fresh**: Try copying a working example and modifying it

### Performance Issues

**Problem: Slow loading or rendering**

*Symptoms:* Long loading times, laggy interaction, browser freezing

*Solutions:*
1. **Reduce complexity**: Use simpler representations (e.g., gaussian instead of molecular surface)
2. **Limit scene content**: Show fewer molecules or components per scene
3. **Check file sizes**: Large structures (say >20MB) may need simplification
4. **Close other tabs**: Free up browser memory
5. **Try a different browser**: Some browsers handle 3D graphics better than others

**Problem: Browser crashes or freezes**

*Symptoms:* Browser becomes unresponsive, page crashes

*Solutions:*
1. **Restart browser**: Close and reopen your browser
2. **Clear cache**: Clear browser cache and cookies for the site
3. **Reduce complexity**: Simplify your scene before trying again
4. **Check memory**: Close other applications to free up system memory

### Authentication and Saving Issues

**Problem: Can't log in**

*Symptoms:* Login button doesn't work, authentication failures

*Solutions:*
1. **Check URL**: Ensure you're on the correct port (usually :3000 for development)
2. **Try incognito mode**: Test in a private/incognito browser window
3. **Clear cookies**: Clear browser cookies for the site
4. **Check institutional access**: Verify your institution supports the authentication system

**Problem: Can't save work**

*Symptoms:* Save button disabled, save operation fails

*Solutions:*
1. **Log in first**: Ensure you're authenticated before trying to save
2. **Check connection**: Verify your internet connection is stable
3. **Try export instead**: Use "Export Session" as a backup method
4. **Reduce file size**: Large stories might exceed upload limits

**Problem: My stories disappeared**

*Symptoms:* Previously saved stories not showing in "My Stories"

*Solutions:*
1. **Check login status**: Ensure you're logged in with the same account
2. **Wait for loading**: Give the "My Stories" page time to load all items
3. **Check different categories**: Look in both Sessions and Published Stories
4. **Contact support**: If stories are truly missing, contact the development team

### Code and Syntax Issues

**Problem: JavaScript errors**

*Symptoms:* Console errors, scenes not updating, unexpected behavior

*Common fixes:*
```javascript
// Missing parentheses
structure.component().representation();  // ✓ Correct
structure.component.representation();    // ✗ Wrong

// Incorrect selector format
{ label_seq_id: 100 }    // ✓ Correct for single residue
label_seq_id: 100        // ✗ Wrong (missing brackets)

// String vs object confusion
.color({ color: 'red' })           // ✓ Correct
.color({ color: red })             // ✗ Wrong (missing quotes)
.color('red')                      // ✗ Wrong (should be object)
```

### Browser-Specific Issues

**Chrome/Chromium**
- Usually the best performance
- If issues occur, try disabling extensions
- Check if hardware acceleration is enabled

**Firefox**
- May have slower 3D rendering
- Ensure WebGL is enabled in settings
- Try setting `webgl.force-enabled` to true in about:config

**Safari**
- Generally good performance on Mac
- May have issues with some advanced features
- Ensure "WebGL" is enabled in Developer menu

**Edge**
- Similar to Chrome in most cases
- Try clearing site data if having issues

## Getting Help

### Self-Help Resources

1. **Browser Console**: Press F12 and check the Console tab for error messages
2. **Example Stories**: Study the pre-built examples for working code patterns
3. **Documentation**: Review the [Core Features](core-features.md) guide for syntax reference

### Reporting Issues

When reporting problems, please include:
- Your browser type and version
- The exact error message (if any)
- Steps to reproduce the issue
- A minimal example that demonstrates the problem

### Community and Support

- **GitHub Issues**: Report bugs at the project repository
- **Documentation Feedback**: Suggest improvements to help others
- **Feature Requests**: Share ideas for new functionality

## Quick Reference

### Emergency Recovery

If everything breaks:
1. **Refresh the page**: Often fixes temporary issues
2. **Clear browser cache**: Hard refresh with Ctrl+F5 (or Cmd+Shift+R on Mac)
3. **Export what you can**: Use "Export Session" if the save function works
4. **Start over**: Sometimes fastest to begin with a fresh story

### Browser Console Commands

Open console (F12) and try these if stuck:
```javascript
// Check if MolViewStories is loaded
console.log(window);

// Check current story state
console.log('Current story:', story);

// Reset view
viewer.resetCamera();
```

Remember: Most issues have simple solutions. When in doubt, try the basics first: refresh the page, simplify your code, and check the browser console for error messages.