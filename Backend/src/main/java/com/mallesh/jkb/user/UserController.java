package com.mallesh.jkb.user;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService svc;

    public UserController(UserService svc) {
        this.svc = svc;
    }

    @GetMapping
    public ResponseEntity<List<User>> list() {
        return ResponseEntity.ok(svc.listAll());
    }

    @PostMapping
    public ResponseEntity<User> create(@RequestBody UserCreateRequest req) {
        User u = svc.create(req);
        return ResponseEntity
                .created(URI.create("/api/users/" + u.getId()))
                .body(u);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> get(@PathVariable Long id) {
        return ResponseEntity.ok(svc.get(id));
    }
}
