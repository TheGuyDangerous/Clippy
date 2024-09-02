import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

class ChatPage extends StatefulWidget {
  final ValueNotifier<ThemeMode> themeModeNotifier;
  final ValueNotifier<double> fontSizeNotifier;

  ChatPage({required this.themeModeNotifier, required this.fontSizeNotifier});

  @override
  _ChatPageState createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  late DatabaseReference _messagesRef;
  final TextEditingController _messageController = TextEditingController();
  List<Map<dynamic, dynamic>> _messages = [];

  @override
  void initState() {
    super.initState();
    _auth.authStateChanges().listen((User? user) {
      if (user != null) {
        _messagesRef =
            FirebaseDatabase.instance.ref().child('chats').child(user.uid);
        _messagesRef.onChildAdded.listen((event) {
          setState(() {
            _messages.add(event.snapshot.value as Map<dynamic, dynamic>);
          });
        });
      }
    });
  }

  Future<void> _sendMessage() async {
    if (_messageController.text.isNotEmpty) {
      await _messagesRef.push().set({
        'text': _messageController.text,
        'sender': _auth.currentUser?.email,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      });
      _messageController.clear();
    }
  }

  Future<void> _logout() async {
    await _auth.signOut();
    Navigator.pushReplacementNamed(context, '/login'); // Navigate to login page
  }

  Future<void> _deleteMessages() async {
    await _messagesRef.remove();
    setState(() {
      _messages.clear();
    });
  }

  void _copyMessage(String text) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Message copied to clipboard')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(kIsWeb ? 'Project Placement' : 'Cdc Fuckerrr'),
        actions: [
          Padding(
            padding: EdgeInsets.only(right: 16.w),
            child: PopupMenuButton<String>(
              icon: Icon(Icons.person),
              onSelected: (String result) {
                switch (result) {
                  case 'delete':
                    _deleteMessages();
                    break;
                  case 'logout':
                    _logout();
                    break;
                  case 'toggle_theme':
                    widget.themeModeNotifier.value =
                        widget.themeModeNotifier.value == ThemeMode.dark
                            ? ThemeMode.light
                            : ThemeMode.dark;
                    break;
                }
              },
              itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
                const PopupMenuItem<String>(
                  value: 'delete',
                  child: Text('Delete Database'),
                ),
                const PopupMenuItem<String>(
                  value: 'logout',
                  child: Text('Logout'),
                ),
                PopupMenuItem<String>(
                  value: 'toggle_theme',
                  child: StatefulBuilder(
                    builder: (BuildContext context, StateSetter setState) {
                      return Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Dark Mode'),
                          Switch(
                            value: widget.themeModeNotifier.value ==
                                ThemeMode.dark,
                            onChanged: (bool value) {
                              setState(() {
                                widget.themeModeNotifier.value =
                                    value ? ThemeMode.dark : ThemeMode.light;
                              });
                            },
                          ),
                        ],
                      );
                    },
                  ),
                ),
                PopupMenuItem<String>(
                  value: 'font_size',
                  child: StatefulBuilder(
                    builder: (BuildContext context, StateSetter setState) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Font Size'),
                          Slider(
                            value: widget.fontSizeNotifier.value,
                            min: 1.0,
                            max: 20.0,
                            divisions: 19,
                            label: widget.fontSizeNotifier.value.toString(),
                            onChanged: (double value) {
                              setState(() {
                                widget.fontSizeNotifier.value = value;
                              });
                            },
                          ),
                        ],
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ValueListenableBuilder<double>(
                valueListenable: widget.fontSizeNotifier,
                builder: (context, fontSize, child) {
                  final adjustedFontSize = kIsWeb ? fontSize * 0.6 : fontSize;
                  return ListView.builder(
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final message = _messages[index];
                      return Column(
                        children: [
                          ListTile(
                            title: GestureDetector(
                              onLongPress: () {
                                _copyMessage(message['text']);
                              },
                              child: Text(
                                message['text'],
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyText1
                                    ?.copyWith(
                                      fontSize: adjustedFontSize.sp,
                                    ),
                                textAlign: TextAlign.start,
                                softWrap: true,
                              ),
                            ),
                            trailing: IconButton(
                              icon: Icon(Icons.copy_all),
                              onPressed: () {
                                _copyMessage(message['text']);
                              },
                            ),
                          ),
                          Divider(), // Add a slim horizontal line after each message
                        ],
                      );
                    },
                  );
                },
              ),
            ),
            Container(
              padding: EdgeInsets.all(8.0.w),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Container(
                      constraints: BoxConstraints(
                        maxHeight:
                            150.h, // Set a maximum height for the input field
                      ),
                      child: TextField(
                        controller: _messageController,
                        decoration: InputDecoration(
                          hintText: 'Enter message',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.all(10.w),
                        ),
                        maxLines: null,
                        keyboardType: TextInputType.multiline,
                        textInputAction: TextInputAction.newline,
                      ),
                    ),
                  ),
                  SizedBox(width: 8.w),
                  IconButton(
                    icon: Icon(Icons.send),
                    onPressed: _sendMessage,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
