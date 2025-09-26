# ComfyUI worker front-end

Một giao diện React đơn giản để gửi prompt sinh ảnh tới ComfyUI worker (local Docker hoặc RunPod serverless).

## Cài đặt & chạy local

```bash
npm install
npm run dev
```

Ứng dụng mặc định kết nối tới `http://127.0.0.1:8188`. Bạn có thể chọn preset khác hoặc nhập URL thủ công trong phần **Worker endpoint**.

## Workflow JSON

- Chép `flux-text2img.json` của bạn vào `public/workflows/`.
- Cập nhật `src/config/workflow.ts` nếu node ID khác với giá trị mặc định.
- Nếu bạn giữ tên file mặc định (`flux-text2img.json`), hãy điều chỉnh `workflowPath` tương ứng.

## Build production

```bash
npm run build
npm run preview
```

Xem thêm tài liệu Docker/RunPod trong thư mục [`src-docker/`](src-docker/README.md).
